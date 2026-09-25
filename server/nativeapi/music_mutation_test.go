package nativeapi_test

import (
	"bytes"
	"encoding/json"
	"mime/multipart"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"time"

	"github.com/navidrome/navidrome/conf"
	"github.com/navidrome/navidrome/conf/configtest"
	"github.com/navidrome/navidrome/core/auth"
	"github.com/navidrome/navidrome/model"
	"github.com/navidrome/navidrome/server"
	"github.com/navidrome/navidrome/server/nativeapi"
	"github.com/navidrome/navidrome/tests"
	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"
)

var _ = Describe("Music Mutation Endpoints", func() {
	var (
		router        http.Handler
		ds            *tests.MockDataStore
		mfRepo        *tests.MockMediaFileRepo
		userRepo      *tests.MockedUserRepo
		w             *httptest.ResponseRecorder
		uploaderUser  model.User
		editorUser    model.User
		regularUser   model.User
		adminUser     model.User
		uploaderToken string
		editorToken   string
		regularToken  string
		adminToken    string
	)

	BeforeEach(func() {
		DeferCleanup(configtest.SetupConfig())
		conf.Server.EnableSharing = false
		conf.Server.SessionTimeout = time.Minute
		conf.Server.MusicFolder = "/tmp/navidwirome_test_music"

		mfRepo = tests.CreateMockMediaFileRepo()
		userRepo = tests.CreateMockUserRepo()

		ds = &tests.MockDataStore{
			MockedMediaFile: mfRepo,
			MockedUser:      userRepo,
			MockedProperty:  &tests.MockedPropertyRepo{},
		}

		auth.Init(ds)

		adminUser = model.User{
			ID:       "u-admin",
			UserName: "admin",
			IsAdmin:  true,
		}
		uploaderUser = model.User{
			ID:        "u-uploader",
			UserName:  "uploader",
			IsAdmin:   false,
			CanUpload: true,
		}
		editorUser = model.User{
			ID:          "u-editor",
			UserName:    "editor",
			IsAdmin:     false,
			CanEditTags: true,
		}
		regularUser = model.User{
			ID:          "u-regular",
			UserName:    "regular",
			IsAdmin:     false,
			CanUpload:   false,
			CanEditTags: false,
		}

		Expect(userRepo.Put(&adminUser)).To(Succeed())
		Expect(userRepo.Put(&uploaderUser)).To(Succeed())
		Expect(userRepo.Put(&editorUser)).To(Succeed())
		Expect(userRepo.Put(&regularUser)).To(Succeed())

		adminToken, _ = auth.CreateToken(&adminUser)
		uploaderToken, _ = auth.CreateToken(&uploaderUser)
		editorToken, _ = auth.CreateToken(&editorUser)
		regularToken, _ = auth.CreateToken(&regularUser)

		w = httptest.NewRecorder()
		nativeRouter := nativeapi.New(ds, nil, nil, nil, tests.NewMockLibraryService(), tests.NewMockUserService(), nil, nil, nil, nil, nil)
		router = server.JWTVerifier(nativeRouter)
	})

	Describe("POST /api/music/upload", func() {
		It("rejects unauthorized users with 403 Forbidden", func() {
			body := &bytes.Buffer{}
			writer := multipart.NewWriter(body)
			part, _ := writer.CreateFormFile("file", "track.mp3")
			part.Write([]byte("fake-mp3-data"))
			writer.Close()

			req := httptest.NewRequest("POST", "/music/upload", body)
			req.Header.Set("Content-Type", writer.FormDataContentType())
			req.Header.Set("x-nd-authorization", "Bearer "+regularToken)

			router.ServeHTTP(w, req)
			Expect(w.Code).To(Equal(http.StatusForbidden))
		})

		It("accepts upload from user with can_upload permission", func() {
			body := &bytes.Buffer{}
			writer := multipart.NewWriter(body)
			part, _ := writer.CreateFormFile("file", "track.mp3")
			part.Write([]byte("fake-mp3-data"))
			writer.Close()

			req := httptest.NewRequest("POST", "/music/upload", body)
			req.Header.Set("Content-Type", writer.FormDataContentType())
			req.Header.Set("x-nd-authorization", "Bearer "+uploaderToken)

			router.ServeHTTP(w, req)
			Expect(w.Code).To(Equal(http.StatusOK))
		})
	})

	Describe("PUT /music/track/:id/tags", func() {
		It("rejects user without can_edit_tags with 403 Forbidden", func() {
			req := httptest.NewRequest("PUT", "/music/track/song-1/tags", bytes.NewBufferString(`{"title":"New Title"}`))
			req.Header.Set("Content-Type", "application/json")
			req.Header.Set("x-nd-authorization", "Bearer "+regularToken)

			router.ServeHTTP(w, req)
			Expect(w.Code).To(Equal(http.StatusForbidden))
		})

		It("accepts tag edit from user with can_edit_tags permission", func() {
			Expect(mfRepo.Put(&model.MediaFile{ID: "song-1", Title: "Old Title", Path: "/tmp/fake.mp3"})).To(Succeed())

			req := httptest.NewRequest("PUT", "/music/track/song-1/tags", bytes.NewBufferString(`{"title":"New Title"}`))
			req.Header.Set("Content-Type", "application/json")
			req.Header.Set("x-nd-authorization", "Bearer "+editorToken)

			router.ServeHTTP(w, req)
			Expect(w.Code).To(Equal(http.StatusOK))
		})

		It("resolves relative path and reorganizes track with fallback cover check", func() {
			testMusicDir := GinkgoT().TempDir()
			conf.Server.MusicFolder = testMusicDir

			inboxDir := filepath.Join(testMusicDir, "_Inbox")
			Expect(os.MkdirAll(inboxDir, 0755)).To(Succeed())
			trackFile := filepath.Join(inboxDir, "track.mp3")
			Expect(os.WriteFile(trackFile, []byte("fake-mp3-audio"), 0644)).To(Succeed())

			Expect(mfRepo.Put(&model.MediaFile{ID: "song-rel", Title: "Old", Path: "_Inbox/track.mp3"})).To(Succeed())

			payload := `{"title":"New Song","artist":"Cool Artist","album":"Great Album"}`
			req := httptest.NewRequest("PUT", "/music/track/song-rel/tags", bytes.NewBufferString(payload))
			req.Header.Set("Content-Type", "application/json")
			req.Header.Set("x-nd-authorization", "Bearer "+editorToken)

			router.ServeHTTP(w, req)
			Expect(w.Code).To(Equal(http.StatusOK))

			updated, err := mfRepo.Get("song-rel")
			Expect(err).NotTo(HaveOccurred())
			Expect(updated.Title).To(Equal("New Song"))
			Expect(updated.Artist).To(Equal("Cool Artist"))
			Expect(updated.Album).To(Equal("Great Album"))

			expectedMovedPath := filepath.Join(testMusicDir, "Cool Artist", "Great Album", "New Song.mp3")
			Expect(expectedMovedPath).To(BeAnExistingFile())
		})
	})

	Describe("DELETE /music/track/:id", func() {
		It("rejects delete from non-admin users with 403 Forbidden", func() {
			req := httptest.NewRequest("DELETE", "/music/track/song-1", nil)
			req.Header.Set("x-nd-authorization", "Bearer "+regularToken)
			router.ServeHTTP(w, req)
			Expect(w.Code).To(Equal(http.StatusForbidden))

			w2 := httptest.NewRecorder()
			req2 := httptest.NewRequest("DELETE", "/music/track/song-1", nil)
			req2.Header.Set("x-nd-authorization", "Bearer "+editorToken)
			router.ServeHTTP(w2, req2)
			Expect(w2.Code).To(Equal(http.StatusForbidden))
		})

		It("accepts delete from admin and removes physical file and db record", func() {
			tmpFile, err := os.CreateTemp("", "test_delete_*.mp3")
			Expect(err).NotTo(HaveOccurred())
			tmpPath := tmpFile.Name()
			tmpFile.Close()

			Expect(mfRepo.Put(&model.MediaFile{ID: "song-del-1", Title: "Delete Me", Path: tmpPath})).To(Succeed())

			req := httptest.NewRequest("DELETE", "/music/track/song-del-1", nil)
			req.Header.Set("x-nd-authorization", "Bearer "+adminToken)

			router.ServeHTTP(w, req)
			Expect(w.Code).To(Equal(http.StatusOK))

			_, statErr := os.Stat(tmpPath)
			Expect(os.IsNotExist(statErr)).To(BeTrue())

			_, dbErr := mfRepo.Get("song-del-1")
			Expect(dbErr).To(HaveOccurred())
		})
	})

	Describe("DELETE /music/album/:id", func() {
		It("rejects delete from non-admin users with 403 Forbidden", func() {
			req := httptest.NewRequest("DELETE", "/music/album/alb-1", nil)
			req.Header.Set("x-nd-authorization", "Bearer "+regularToken)
			router.ServeHTTP(w, req)
			Expect(w.Code).To(Equal(http.StatusForbidden))
		})

		It("accepts delete from admin and removes album tracks and files", func() {
			tmpFile, err := os.CreateTemp("", "test_alb_*.mp3")
			Expect(err).NotTo(HaveOccurred())
			tmpPath := tmpFile.Name()
			tmpFile.Close()

			Expect(mfRepo.Put(&model.MediaFile{ID: "song-alb-1", AlbumID: "alb-del-1", Title: "Album Song", Path: tmpPath})).To(Succeed())

			req := httptest.NewRequest("DELETE", "/music/album/alb-del-1", nil)
			req.Header.Set("x-nd-authorization", "Bearer "+adminToken)

			router.ServeHTTP(w, req)
			Expect(w.Code).To(Equal(http.StatusOK))

			_, statErr := os.Stat(tmpPath)
			Expect(os.IsNotExist(statErr)).To(BeTrue())

			_, dbErr := mfRepo.Get("song-alb-1")
			Expect(dbErr).To(HaveOccurred())
		})

		It("cleans up custom named cover art and empty directory on album delete", func() {
			testMusicDir := GinkgoT().TempDir()
			conf.Server.MusicFolder = testMusicDir

			albumFolder := filepath.Join(testMusicDir, "Pink Floyd", "The Wall")
			Expect(os.MkdirAll(albumFolder, 0755)).To(Succeed())

			trackPath := filepath.Join(albumFolder, "01 - In the Flesh.mp3")
			Expect(os.WriteFile(trackPath, []byte("audio"), 0644)).To(Succeed())

			coverPath := filepath.Join(albumFolder, "Pink Floyd - The Wall.jpg")
			Expect(os.WriteFile(coverPath, []byte("artwork"), 0644)).To(Succeed())

			Expect(mfRepo.Put(&model.MediaFile{ID: "track-pf-1", AlbumID: "alb-pf", Title: "In the Flesh", Path: "Pink Floyd/The Wall/01 - In the Flesh.mp3"})).To(Succeed())

			req := httptest.NewRequest("DELETE", "/music/album/alb-pf", nil)
			req.Header.Set("x-nd-authorization", "Bearer "+adminToken)

			router.ServeHTTP(w, req)
			Expect(w.Code).To(Equal(http.StatusOK))

			_, trackStat := os.Stat(trackPath)
			Expect(os.IsNotExist(trackStat)).To(BeTrue())

			_, coverStat := os.Stat(coverPath)
			Expect(os.IsNotExist(coverStat)).To(BeTrue())

			_, dirStat := os.Stat(albumFolder)
			Expect(os.IsNotExist(dirStat)).To(BeTrue())
		})
	})

	Describe("GET /api/me", func() {
		It("returns 401 Unauthorized for unauthenticated requests", func() {
			req := httptest.NewRequest("GET", "/me", nil)
			router.ServeHTTP(w, req)
			Expect(w.Code).To(Equal(http.StatusUnauthorized))
		})

		It("returns current user profile and permissions", func() {
			req := httptest.NewRequest("GET", "/me", nil)
			req.Header.Set("x-nd-authorization", "Bearer "+uploaderToken)

			router.ServeHTTP(w, req)
			Expect(w.Code).To(Equal(http.StatusOK))

			var res map[string]any
			Expect(json.Unmarshal(w.Body.Bytes(), &res)).To(Succeed())
			Expect(res["username"]).To(Equal("uploader"))
			Expect(res["canUpload"]).To(Equal(true))
			Expect(res["isAdmin"]).To(Equal(false))
		})
	})
})
