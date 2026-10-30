package com.example.Drive_Service.service;

import com.example.Drive_Service.model.DriveItem;
import com.example.Drive_Service.repo.ItemRepository;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.web.server.ResponseStatusException;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class ItemServiceTest {

    private final ItemRepository repository = Mockito.mock(ItemRepository.class);
    private final ItemService service = new ItemService(repository);

    @Test
    void rejectsUnsafeNames() {
        for (String bad : new String[]{null, "", "  ", ".", "..", "a/b", "a\\b"}) {
            assertThrows(ResponseStatusException.class,
                    () -> service.create(bad, null, DriveItem.Kind.FOLDER, 0, null));
        }
    }

    @Test
    void folderIsReadyAndFileIsPending() {
        Mockito.when(repository.saveAndFlush(Mockito.any(DriveItem.class)))
                .thenAnswer(call -> call.getArgument(0));

        DriveItem folder = service.create("docs", null, DriveItem.Kind.FOLDER, 0, null);
        DriveItem file = service.create("a.txt", null, DriveItem.Kind.FILE, 5, "text/plain");

        assertEquals(DriveItem.Status.READY, folder.getStatus());
        assertEquals(DriveItem.Status.PENDING, file.getStatus());
    }
}
