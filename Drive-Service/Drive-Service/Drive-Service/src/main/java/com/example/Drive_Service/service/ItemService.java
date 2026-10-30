package com.example.Drive_Service.service;

import com.example.Drive_Service.model.DriveItem;
import com.example.Drive_Service.repo.ItemRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@Service
public class ItemService {

    private final ItemRepository itemRepository;

    public ItemService(ItemRepository itemRepository) {
        this.itemRepository = itemRepository;
    }

    @Transactional
    public DriveItem create(String name, UUID parentId, DriveItem.Kind kind, long size, String mediaType) {
        if (name == null || name.isBlank() || name.length() > 255
                || name.equals(".") || name.equals("..")
                || name.contains("/") || name.contains("\\")
                || name.chars().anyMatch(Character::isISOControl)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Use a proper name");
        }
        if (parentId != null) {
            DriveItem parent = itemRepository.lockById(parentId).orElseThrow(ItemService::missing);
            requireReadyFolder(parent);
        }
        return itemRepository.saveAndFlush(new DriveItem(name, parentId, kind, size, mediaType));
    }

    @Transactional(readOnly = true)
    public List<DriveItem> list(UUID parentId) {
        if (parentId != null) {
            DriveItem parent = itemRepository.findById(parentId).orElseThrow(ItemService::missing);
            requireReadyFolder(parent);
        }
        return itemRepository.findByParentIdAndStatusOrderByNameAsc(parentId, DriveItem.Status.READY);
    }

    @Transactional(readOnly = true)
    public DriveItem get(UUID id) {
        DriveItem item = itemRepository.findById(id).orElseThrow(ItemService::missing);
        if (item.getStatus() != DriveItem.Status.READY) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Item is not ready");
        }
        return item;
    }

    @Transactional
    public DriveItem ready(UUID id) {
        DriveItem item = itemRepository.findById(id).orElseThrow(ItemService::missing);
        if (item.getStatus() != DriveItem.Status.PENDING) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Upload was cancelled");
        }
        item.setStatus(DriveItem.Status.READY);
        return item;
    }

    @Transactional
    public DriveItem delete(UUID id) {
        DriveItem item = itemRepository.lockById(id).orElseThrow(ItemService::missing);
        if (item.getStatus() == DriveItem.Status.PENDING) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Upload still in progress");
        }
        if (item.getKind() == DriveItem.Kind.FOLDER && itemRepository.existsByParentId(id)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Folder is not empty");
        }
        item.setStatus(DriveItem.Status.DELETED);
        return item;
    }

    @Transactional
    public void remove(UUID id) {
        itemRepository.deleteById(id);
    }

    private static void requireReadyFolder(DriveItem parent) {
        if (parent.getKind() != DriveItem.Kind.FOLDER || parent.getStatus() != DriveItem.Status.READY) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Parent must be an available folder");
        }
    }

    private static ResponseStatusException missing() {
        return new ResponseStatusException(HttpStatus.NOT_FOUND, "Item not found");
    }
}
