package pl.nbp.copilot.llm;

import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import pl.nbp.copilot.application.LlmUnavailableException;
import pl.nbp.copilot.model.CaseSession;
import pl.nbp.copilot.model.CaseType;
import pl.nbp.copilot.model.DecisionResult;
import pl.nbp.copilot.model.ImageAnalysis;

@Component
@Profile("!stub-llm & !test")
public class OpenRouterLlmGateway implements LlmGateway {

    @Override
    public ImageAnalysis analyzeImage(CaseType scenario, byte[] imageBytes) {
        throw new LlmUnavailableException("OpenRouter LLM gateway not yet implemented");
    }

    @Override
    public DecisionResult decide(CaseType scenario, CaseSession session, String policyText) {
        throw new LlmUnavailableException("OpenRouter LLM gateway not yet implemented");
    }

    @Override
    public void streamChat(CaseSession session, String userMessage, SseEmitter emitter) {
        throw new LlmUnavailableException("OpenRouter LLM gateway not yet implemented");
    }
}
