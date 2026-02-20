package rbac

import (
	"database/sql"
	"log"

	_ "github.com/mattn/go-sqlite3"
)

type DB struct {
	db *sql.DB
}

type UserRole struct {
	Email string `json:"email"`
	Role  string `json:"role"`
}

func InitDB(path string) (*DB, error) {
	db, err := sql.Open("sqlite3", path)
	if err != nil {
		return nil, err
	}

	createTableQuery := `
	CREATE TABLE IF NOT EXISTS user_roles (
		email TEXT PRIMARY KEY,
		role TEXT NOT NULL
	);
	`
	_, err = db.Exec(createTableQuery)
	if err != nil {
		return nil, err
	}

	return &DB{db: db}, nil
}

func (d *DB) Close() {
	d.db.Close()
}

func (d *DB) GetUserRole(email string) (string, error) {
	var role string
	err := d.db.QueryRow("SELECT role FROM user_roles WHERE email = ?", email).Scan(&role)
	if err != nil {
		if err == sql.ErrNoRows {
			return "viewer", nil // Default role
		}
		return "", err
	}
	return role, nil
}

func (d *DB) SetUserRole(email, role string) error {
	_, err := d.db.Exec(`
		INSERT INTO user_roles (email, role) VALUES (?, ?)
		ON CONFLICT(email) DO UPDATE SET role=excluded.role
	`, email, role)
	return err
}

func (d *DB) GetAllUsers() ([]UserRole, error) {
	rows, err := d.db.Query("SELECT email, role FROM user_roles")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var users []UserRole
	for rows.Next() {
		var u UserRole
		if err := rows.Scan(&u.Email, &u.Role); err != nil {
			log.Println("Error scanning row:", err)
			continue
		}
		users = append(users, u)
	}
	return users, nil
}
