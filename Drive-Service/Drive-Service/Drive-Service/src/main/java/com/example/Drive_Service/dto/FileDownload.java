package com.example.Drive_Service.dto;

import feign.Response;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;

public record FileDownload(String name, long size, Response response) implements AutoCloseable {

    public void writeTo(OutputStream outputStream) throws IOException {
        try {
            if (response.body() == null) {
                return;
            }
            try (InputStream input = response.body().asInputStream()) {
                input.transferTo(outputStream);
            }
        } finally {
            close();
        }
    }

    @Override
    public void close() {
        response.close();
    }
}
