# Drive-Service

Spring Boot 3.4.4 / Java 21 service that keeps Drive metadata (folders and files) in H2 and stores file
bytes in a separate **Storage-Service** (`drive.storage.url`, default `http://localhost:8092`).

## Run
    ./mvnw spring-boot:run        (Windows: mvnw.cmd spring-boot:run)
    ./mvnw clean test             (run the tests)

Service port: 8091. H2 console: http://localhost:8091/h2-console (JDBC URL `jdbc:h2:file:./data/drive`, user `sa`).

## API
| Method | Path | Purpose |
|---|---|---|
| POST | /api/folders | JSON `{"name":"docs","parentId":null}` |
| GET | /api/items?parentId= | List READY items in a folder (root if omitted) |
| POST | /api/files | multipart: `file`, optional `parentId` |
| GET | /api/files/{id}/content | Download a file |
| DELETE | /api/items/{id} | Delete a file or an empty folder |

Folders and listing work on their own. Upload, download and file delete need Storage-Service running;
if it is down you get 503 (unreachable), 502 (error) or 404 (missing object) instead of a 500.
