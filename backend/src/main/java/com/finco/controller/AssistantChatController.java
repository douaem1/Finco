package com.finco.controller;

import com.finco.dto.AssistantChatRequest;
import com.finco.dto.AssistantChatResponse;
import com.finco.service.AssistantChatService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/assistant")
public class AssistantChatController {

    private final AssistantChatService assistantChatService;

    public AssistantChatController(AssistantChatService assistantChatService) {
        this.assistantChatService = assistantChatService;
    }

    @PostMapping("/chat")
    public AssistantChatResponse discuter(@Valid @RequestBody AssistantChatRequest request) {
        return new AssistantChatResponse(assistantChatService.repondre(request.messages()));
    }
}
