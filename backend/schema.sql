-- 1. Tabela de Usuários (com RBAC: ORGANIZER, CLIENT, GATEKEEPER)
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('ORGANIZER', 'CLIENT', 'GATEKEEPER') DEFAULT 'CLIENT',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabela de Eventos (criados por organizadores e integrados a filmes/shows)
CREATE TABLE IF NOT EXISTS events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    date DATETIME NOT NULL,
    location VARCHAR(255) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    capacity INT NOT NULL,
    tmdb_id INT NULL,
    poster_url VARCHAR(500) NULL,
    organizer_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (organizer_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 3. Tabela de Assentos/Lugares
CREATE TABLE IF NOT EXISTS seats (
    id INT AUTO_INCREMENT PRIMARY KEY,
    event_id INT NOT NULL,
    seat_number VARCHAR(50) NOT NULL,
    status ENUM('AVAILABLE', 'HELD', 'SOLD') DEFAULT 'AVAILABLE',
    held_by_user_id INT NULL,
    held_until DATETIME NULL,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    FOREIGN KEY (held_by_user_id) REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE KEY unique_event_seat (event_id, seat_number)
);

-- 4. Tabela de Ingressos/Tickets
CREATE TABLE IF NOT EXISTS tickets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ticket_code VARCHAR(100) NOT NULL UNIQUE,
    qr_code_hash VARCHAR(255) NOT NULL UNIQUE,
    status ENUM('VALID', 'USED', 'CANCELLED') DEFAULT 'VALID',
    event_id INT NOT NULL,
    user_id INT NOT NULL,
    seat_id INT UNIQUE NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    used_at DATETIME NULL,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (seat_id) REFERENCES seats(id) ON DELETE SET NULL
);