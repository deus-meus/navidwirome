package nativeapi_test

import (
	"bytes"
	"mime/multipart"
	"net/http"
	"net/http/httptest"
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
		router         http.Handler
		ds             *tests.MockDataStore
		mfRepo         *tests.MockMediaFileRepo
		userRepo       *tests.MockedUserRepo
		w              *httptest.ResponseRecorder
		uploaderUser   model.User
		editorUser     model.User
		regularUser    model.User
		uploaderToken  string
		editorToken    string
		regularToken   string
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

		Expect(userRepo.Put(&uploaderUser)).To(Succeed())
		Expect(userRepo.Put(&editorUser)).To(Succeed())
		Expect(userRepo.Put(&regularUser)).To(Succeed())

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
	})
})
