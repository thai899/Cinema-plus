# Cinema Plus

A full-stack cinema management application with a Spring Boot backend and a React + Vite frontend.

## Prerequisites

- Java 17 or later
- Maven (`mvn`) installed and available on `PATH`
- Node.js and npm
- npm install axios

> If Maven is not installed, install it on Windows using a package manager such as `winget`, or download it from https://maven.apache.org/download.cgi.

## Backend Setup

1. Open a terminal.
2. Change to the backend folder:

```powershell
Set-Location -Path .\cinema-plus\backend
```

3. Run the backend:

```powershell
mvn spring-boot:run
```

The backend starts on `http://localhost:8081`.

### Database Options

The backend is configured by default to use an in-memory H2 database.

- H2 console is enabled at `http://localhost:8080/h2-console`
- JDBC URL: `jdbc:h2:mem:cinemaplusdb`

If you want to use SQL Server instead, uncomment and update the SQL Server settings in `backend/src/main/resources/application.properties`.

## Frontend Setup

1. Open a separate terminal.
2. Change to the frontend folder:

```powershell
cd /d D:\java\cinema-plus\cinema-plus\frontend
Set-Location -Path .\cinema-plus\frontend
```

3. Install dependencies:

```powershell
npm install
```

4. Run the frontend:

```powershell
npm run dev
```

The frontend starts on `http://localhost:5173`.

## Run order

1. Start the backend first.
2. Start the frontend second.

## Notes

- Backend port: `8080`
- Frontend port: `5173`
- If the frontend cannot reach the backend, check that the backend is running and listening on port `8080`.
- For production, replace the JWT secret and use an external database instead of H2.
