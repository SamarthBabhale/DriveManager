package com.example.Drive_Service.service;

import com.example.Drive_Service.client.StorageClient;
import com.example.Drive_Service.dto.FileDownload;
import com.example.Drive_Service.model.DriveItem;
import feign.Response;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@Service
public class DriveService {
    private static final Logger log = LoggerFactory.getLogger(DriveService.class);

    private final ItemService itemService;
    private final StorageClient storageClient;

    public DriveService(ItemService itemService, StorageClient storageClient) {
        this.itemService = itemService;
        this.storageClient = storageClient;
    }

    public DriveItem createFolder(String name, UUID parentId) {
        return itemService.create(name, parentId, DriveItem.Kind.FOLDER, 0, null);
    }

    public List<DriveItem> list(UUID parentId) {
        return itemService.list(parentId);
    }

    public DriveItem upload(MultipartFile file, UUID parentId) {
        DriveItem item = itemService.create(file.getOriginalFilename(), parentId, DriveItem.Kind.FILE,
                file.getSize(), file.getContentType());
        try {
            storageClient.put(item.getId(), file);
            return itemService.ready(item.getId());
        } catch (RuntimeException e) {
            cleanUpFailedUpload(item.getId());
            throw e;
        }
    }

    public FileDownload download(UUID id) {
        DriveItem item = itemService.get(id);
        if (item.getKind() != DriveItem.Kind.FILE) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A folder has no content");
        }
        Response response = storageClient.get(id);
        return new FileDownload(item.getName(), item.getSize(), response);
    }

    public void delete(UUID id) {
        DriveItem item = itemService.delete(id);
        if (item.getKind() == DriveItem.Kind.FILE) {
            storageClient.delete(id);
        }
        itemService.remove(id);
    }

    /** Always drops the metadata row; removing the stored object is best effort. */
    private void cleanUpFailedUpload(UUID id) {
        try {
            storageClient.delete(id);
        } catch (RuntimeException e) {
            log.warn("Stored object {} could not be removed after a failed upload", id, e);
        }
        try {
            itemService.remove(id);
        } catch (RuntimeException e) {
            log.warn("Pending upload {} needs cleanup", id, e);
        }
    }
}
