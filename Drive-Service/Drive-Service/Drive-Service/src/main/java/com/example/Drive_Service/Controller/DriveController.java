package com.example.Drive_Service.Controller;

import com.example.Drive_Service.dto.FileDownload;
import com.example.Drive_Service.dto.FolderRequest;
import com.example.Drive_Service.model.DriveItem;
import com.example.Drive_Service.service.DriveService;
import jakarta.validation.Valid;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api")
public class DriveController {
    private final DriveService drive;

    public DriveController(DriveService drive) {
        this.drive = drive;
    }

    @PostMapping("/folders")
    @ResponseStatus(HttpStatus.CREATED)
    public DriveItem folder(@Valid @RequestBody FolderRequest request) {
        return drive.createFolder(request.name(), request.parentId());
    }

    @GetMapping("/items")
    public List<DriveItem> list(@RequestParam(name = "parentId", required = false) UUID parentId) {
        return drive.list(parentId);
    }

    @PostMapping(value = "/files", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    public DriveItem upload(@RequestPart("file") MultipartFile file,
                            @RequestParam(name = "parentId", required = false) UUID parentId) {
        return drive.upload(file, parentId);
    }

    @GetMapping("/files/{id}/content")
    public ResponseEntity<StreamingResponseBody> download(@PathVariable("id") UUID id) {
        FileDownload download = drive.download(id);
        try {
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION,
                            ContentDisposition.attachment()
                                    .filename(download.name(), StandardCharsets.UTF_8)
                                    .build().toString())
                    .header("X-Content-Type-Options", "nosniff")
                    .contentType(MediaType.APPLICATION_OCTET_STREAM)
                    .contentLength(download.size())
                    .body(download::writeTo);
        } catch (RuntimeException e) {
            download.close();
            throw e;
        }
    }

    @DeleteMapping("/items/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable("id") UUID id) {
        drive.delete(id);
    }

}
