package pl.nbp.copilot.llm;

import org.springframework.stereotype.Component;
import pl.nbp.copilot.model.CaseSession;
import pl.nbp.copilot.model.CaseType;
import pl.nbp.copilot.model.ImageAnalysis;

@Component
public class PromptCatalog {

    public String imageAnalysisPrompt(CaseType scenario) {
        return switch (scenario) {
            case ZWROT -> """
                Jesteś asystentem analizy zdjęć dla serwisu obsługi zwrotów sprzętu elektronicznego.
                Przeanalizuj zdjęcie i określ:
                1. Czy widoczne są ślady użytkowania (zarysowania, przetarcia, zabrudzenia)?
                2. Czy widoczne są uszkodzenia?
                3. Czy sprzęt wygląda na kompletny?
                4. Czy sprzęt nadaje się do ponownej sprzedaży jako nowy?

                Używaj wyłącznie tego, co widać na zdjęciu. Gdy nie możesz ocenić czegoś z całą pewnością, użyj wartości UNCERTAIN.
                Odpowiedz wyłącznie w formacie JSON zgodnym z podanym schematem.
                """;
            case REKLAMACJA -> """
                Jesteś asystentem analizy zdjęć dla serwisu reklamacyjnego sprzętu elektronicznego.
                Przeanalizuj zdjęcie i określ:
                1. Czy widoczne jest uszkodzenie? Jeśli tak — jaki jest jego typ?
                2. Jaka jest najbardziej prawdopodobna przyczyna: wada produkcyjna, uszkodzenie przez użytkownika, normalne zużycie, czy nie można określić?

                Używaj wyłącznie tego, co widać na zdjęciu. Gdy przyczyna jest niejednoznaczna, użyj INCONCLUSIVE.
                Odpowiedz wyłącznie w formacie JSON zgodnym z podanym schematem.
                """;
        };
    }

    public String decisionPrompt(CaseType scenario, CaseSession session, ImageAnalysis analysis, String policyText) {
        String formData = """
            Typ zgłoszenia: %s
            Kategoria sprzętu: %s
            Model: %s
            Data zakupu: %s
            Opis/powód: %s
            """.formatted(
                session.getType(), session.getCategory(), session.getModel(),
                session.getPurchaseDate(), session.getReason() != null ? session.getReason() : "(brak)"
            );
        String analysisData = """
            Wyniki analizy zdjęcia:
            Podsumowanie: %s
            Obserwacje: %s
            Pewność: %s
            """.formatted(analysis.summary(), String.join(", ", analysis.observations()), analysis.confidence());

        return switch (scenario) {
            case ZWROT -> """
                Jesteś agentem oceniającym zasadność wniosku o zwrot sprzętu elektronicznego.

                DANE FORMULARZA:
                %s

                ANALIZA ZDJĘCIA:
                %s

                POLITYKA ZWROTÓW (stosuj wyłącznie te zasady):
                %s

                Na podstawie powyższych danych oceń zasadność zwrotu. Wydaj dokładnie jedną z czterech decyzji: ELIGIBLE, NOT_ELIGIBLE, NEEDS_HUMAN_REVIEW, MORE_INFO_REQUIRED.
                Nigdy nie wymyślaj faktów ani zasad spoza podanej polityki.
                Gdy dowody są sprzeczne lub niewystarczające — wybierz NEEDS_HUMAN_REVIEW lub MORE_INFO_REQUIRED.
                Odpowiedź w języku polskim, wyłącznie w formacie JSON zgodnym z podanym schematem.
                """.formatted(formData, analysisData, policyText);
            case REKLAMACJA -> """
                Jesteś agentem oceniającym zasadność reklamacji sprzętu elektronicznego.

                DANE FORMULARZA:
                %s

                ANALIZA ZDJĘCIA:
                %s

                POLITYKA REKLAMACJI (stosuj wyłącznie te zasady):
                %s

                Na podstawie powyższych danych oceń zasadność reklamacji. Wydaj dokładnie jedną z czterech decyzji: ELIGIBLE, NOT_ELIGIBLE, NEEDS_HUMAN_REVIEW, MORE_INFO_REQUIRED.
                Nigdy nie wymyślaj faktów ani zasad spoza podanej polityki.
                Gdy dowody są sprzeczne lub niewystarczające — wybierz NEEDS_HUMAN_REVIEW lub MORE_INFO_REQUIRED.
                Odpowiedź w języku polskim, wyłącznie w formacie JSON zgodnym z podanym schematem.
                """.formatted(formData, analysisData, policyText);
        };
    }

    public String chatSystemPrompt(CaseSession session) {
        return """
            Jesteś pomocnym asystentem obsługi klienta specjalizującym się w reklamacjach i zwrotach sprzętu elektronicznego.

            Pomagasz klientowi w sprawie: %s (typ: %s, model: %s).
            Podjęta wstępna decyzja: %s.

            Zasady:
            - Odpowiadaj wyłącznie na pytania związane z reklamacją lub zwrotem klienta.
            - Jeśli pytanie jest niezwiązane z tematem, grzecznie odmów i wróć do tematu zgłoszenia.
            - Nie podejmuj wiążących decyzji — Twoja rola jest doradcza.
            - Nie wymyślaj faktów, cen, terminów ani zasad spoza podanych informacji.
            - Odpowiadaj w języku polskim, uprzejmie i zrozumiale.
            """.formatted(
                session.getCategory(), session.getType(), session.getModel(),
                session.getDecision() != null ? session.getDecision().category() : "w toku"
            );
    }
}
