package repository

import (
	"database/sql"
	"fmt"
	"strings"

	"golang.org/x/crypto/bcrypt"
)

type GroupRepository struct {
	db *sql.DB
}

func NewGroupRepository(db *sql.DB) *GroupRepository {
	return &GroupRepository{db: db}

}

func (r *GroupRepository) CreateGroup(name, password string) error {
	hashedPassword, _ := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	query := `INSERT INTO groups (name, password_hash) VALUES ($1, $2)`
	_, err := r.db.Exec(query, name, string(hashedPassword))
	return err
}

func (r *GroupRepository) JoinGroup(userID int, groupName, password string) error {
	var groupID int
	var hash string

	err := r.db.QueryRow("SELECT id, password_hash FROM groups WHERE name = $1", groupName).Scan(&groupID, &hash)
	if err != nil {
		return fmt.Errorf("group not found")
	}

	if err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password)); err != nil {
		return fmt.Errorf("invalid password")

	}
	query := `INSERT INTO group_members (user_id, group_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`
	_, err = r.db.Exec(query, userID, groupID)
	return err
}

func (r *GroupRepository) IsMember(userID int, groupName string) bool {
	var exists bool
	query := `
	SELECT EXISTS (
		SELECT 1 FROM group_members gm 
		JOIN groups g ON g.id = gm.group_id
		WHERE gm.user_id = $1 AND g.name = $2
	)`
	r.db.QueryRow(query, userID, groupName).Scan(&exists)
	return exists
}
func (r *GroupRepository) GetGroupsForUser(userID int) ([]string, error) {
	rows, err := r.db.Query(`
        SELECT g.name FROM groups g
        JOIN group_members gm ON g.id = gm.group_id
        WHERE gm.user_id = $1
    `, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	groups := []string{}
	for rows.Next() {
		var name string
		if err := rows.Scan(&name); err != nil {
			continue
		}
		groups = append(groups, strings.ToLower(name))
	}
	return groups, nil
}
