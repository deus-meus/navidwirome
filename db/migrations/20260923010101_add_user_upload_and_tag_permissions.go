package migrations

import (
	"context"
	"database/sql"

	"github.com/pressly/goose/v3"
)

func init() {
	goose.AddMigrationContext(upAddUserUploadAndTagPermissions, downAddUserUploadAndTagPermissions)
}

func upAddUserUploadAndTagPermissions(ctx context.Context, tx *sql.Tx) error {
	queries := []string{
		`ALTER TABLE user ADD COLUMN can_upload BOOLEAN NOT NULL DEFAULT 0;`,
		`ALTER TABLE user ADD COLUMN can_edit_tags BOOLEAN NOT NULL DEFAULT 0;`,
		`UPDATE user SET can_upload = 1, can_edit_tags = 1 WHERE is_admin = 1;`,
	}
	for _, q := range queries {
		if _, err := tx.ExecContext(ctx, q); err != nil {
			return err
		}
	}
	return nil
}

func downAddUserUploadAndTagPermissions(ctx context.Context, tx *sql.Tx) error {
	return nil
}
