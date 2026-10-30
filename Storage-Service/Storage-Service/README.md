# Storage-Service

Spring Boot 4.1.2 / Java 21 / Gradle service that stores file bytes on disk for Drive-Service.
Files are saved by UUID in `storage.directory` (default `./data/objects`, override with env `DRIVE_STORAGE_DIR`).

## Run
    ./gradlew bootRun         (Windows: gradlew.bat bootRun)
    ./gradlew clean test      (run the tests)

Port 8092. Start this service before using upload/download in Drive-Service (port 8091).

## Internal API
| Method | Path | Result |
|---|---|---|
| PUT | /internal/objects/{id} | multipart `file`; 204 |
| GET | /internal/objects/{id} | file bytes; 404 if missing |
| DELETE | /internal/objects/{id} | 204 (also when already gone) |
