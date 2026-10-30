package com.cfs.Storage_Service.repo;

import com.cfs.Storage_Service.config.StorageProperties;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.core.io.Resource;
import org.springframework.web.server.ResponseStatusException;

import java.io.ByteArrayInputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Path;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class DataStoreTest {

    @TempDir
    Path dir;

    @Test
    void putGetDeleteRoundTrip() throws Exception {
        DataStore store = new DataStore(new StorageProperties(dir.toString()));
        UUID id = UUID.randomUUID();

        store.put(id, new ByteArrayInputStream("hello".getBytes(StandardCharsets.UTF_8)));
        Resource stored = store.get(id);
        assertEquals("hello", new String(stored.getInputStream().readAllBytes(), StandardCharsets.UTF_8));

        store.delete(id);
        assertThrows(ResponseStatusException.class, () -> store.get(id));
        store.delete(id); // deleting twice is harmless
    }
}
