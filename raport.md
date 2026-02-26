# Raport z audytu mapowania zasobów Kubernetes (K8s API vs Project Schemas)

## 1. Wstęp
Celem audytu była weryfikacja poprawności odwzorowania rzeczywistych zasobów Kubernetes w projekcie, analiza spójności danych pomiędzy backendem (mocki i realne API) a frontendem (ResourceList, OverviewTab).

---

## 2. Kluczowe znaleziska (Backend Mapping)

### Pods (`/api/resources/pods`)
*   **Realne API:** W pliku `backend/handlers/resources.go` (linie 427-431), wartości takie jak `ready`, `restarts`, `cpu` i `ram` są **zakodowane na sztywno** (`1/1`, `0`, `15m`, `32Mi`).
*   **Makiety:** W `mockResourceList` te pola są poprawnie symulowane, ale rzeczywiste połączenie z klastrem będzie zwracać nieprawdziwe dane.
*   **Rekomendacja:** Należy zaimplementować dynamiczne wyliczanie tych wartości ze statusu kontenerów i metryk.

### Services (`/api/resources/services`)
*   **Realne API:** Pole `endpoints` jest ustawione na sztywno jako `10.244.1.5:8080` (linia 483).
*   **Rekomendacja:** Pobieranie danych z powiązanego obiektu `Endpoints`.

### DaemonSets (`/api/resources/daemonsets`)
*   **Status:** Mapowanie wygląda na poprawne. Pobierane są `desired`, `ready`, `available` oraz lista obrazów z szablonu podów.

### Ingresses
*   **Frontend:** Szuka `extra.address` (Endpoints) i `extra.hosts`.
*   **Backend (Real API):** Mapowanie dla `ingresses` w `List` jest **niekompletne**. Brakuje mapowania `address` i `hosts` (pola te są puste lub nieobecne w `Extra`).

---

## 3. Analiza spójności Mockup vs API Spec

| Zasób | Pole (Frontend) | Mockup (Backend) | Real API Mapping | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Pod** | `extra.ready` | "1/1" (dynamic) | "1/1" (static!) | ⚠️ Krytyczne |
| **Pod** | `extra.images` | "nginx:1.21..." | Brak mapowania | ❌ Brak danych |
| **Deployment** | `extra.ready` | "3/3" (dynamic) | Mapowane ze statusu | ✅ OK |
| **Service** | `extra.endpoints` | "10.0.0.1:443" | "10.244.1.5:8080" (static) | ⚠️ Krytyczne |
| **Ingress** | `extra.hosts` | "app.example.com" | Brak mapowania | ❌ Brak danych |
| **PVC** | `extra.capacity` | "50Gi" | Mapowane ze statusu | ✅ OK |

---

## 4. Błędy w mapowaniu typów (ResourceList.jsx)

W `ResourceList.jsx` schematy kolumn dla niektórych zasobów nie mają odpowiedników w `Extra` zwracanym przez backend (zarówno w mockach, jak i realnym API):

1.  **Jobs:** Kolumna `extra.images` jest zdefiniowana na frontendzie, ale backend dla `jobs` nie mapuje obrazów w metodzie `List`.
2.  **ConfigMaps/Secrets:** Backend przesyła `extra.data` (liczbę kluczy), ale frontend w schemacie nie wyświetla tej kolumny (widoczne tylko w szczegółach).
3.  **Events:** Frontend szuka `extra.last-seen`, `extra.object`, `extra.message`. Backend mapuje je poprawnie jako `lastSeen`, `object`, `message` (bez prefiksu `extra`). **Błąd:** Funkcja `getVal` na frontendzie szuka ich w `extra`, co może powodować wyświetlanie pustych pól.

---

## 5. Rekomendacje Senior DevOps

1.  **Usunięcie statycznych wartości:** Priorytetem jest zastąpienie statycznych stringów w `backend/handlers/resources.go` rzeczywistą logiką parsowania obiektów K8s.
2.  **Ujednolicenie `Extra`:** Wprowadzenie standardowego helpera w Go, który wyciąga metadane (Labels, Annotations, Images) dla wszystkich typów workloadów (Pod, Deployment, DS, STS, Job).
3.  **Poprawa `getVal` na Frontendzie:** Weryfikacja, czy wszystkie pola w schematach faktycznie znajdują się w obiekcie `extra`. Jeśli pole jest w głównym obiekcie (jak `status`), nie powinno mieć prefiksu `extra.` w kluczu kolumny.
4.  **Dodanie brakujących zasobów:** Brakuje mapowania dla `StatefulSets` w rzeczywistym API (obecnie używa domyślnego mapowania, które jest bardzo ubogie).

---
*Raport wygenerowany przez Gemini CLI - Senior Developer/DevOps Auditor.*
