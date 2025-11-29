# AI Development Rules for CineMatch AI

This document outlines the core technologies and best practices for developing the CineMatch AI application. Adhering to these rules ensures consistency, maintainability, and optimal performance.

## Tech Stack Overview

1.  **React (with TypeScript):** The primary library for building the user interface, ensuring a component-based architecture and strong type safety.
2.  **Vite:** Used as the build tool and development server, providing a fast and efficient development experience.
3.  **Tailwind CSS:** The exclusive utility-first CSS framework for all styling, promoting rapid UI development and responsive design.
4.  **Google GenAI SDK (`@google/genai`):** The official SDK for interacting with Google's generative AI models, including Gemini for text and image generation, and Veo for video generation.
5.  **React Router:** Utilized for client-side routing, managing navigation and different views within the single-page application.
6.  **shadcn/ui:** A collection of re-usable components built with Radix UI and Tailwind CSS, providing accessible and customizable UI elements.
7.  **Radix UI:** The underlying primitive components for building accessible UI, often used indirectly via shadcn/ui, but available for custom accessible components when needed.
8.  **Lucide React:** The chosen icon library for all visual iconography within the application.

## Library Usage Guidelines

*   **UI Components:**
    *   **Prioritize shadcn/ui:** For any standard UI elements (buttons, forms, cards, dialogs, etc.), always start by looking for a suitable component in `shadcn/ui`.
    *   **Custom Components:** If `shadcn/ui` does not offer a specific component or if significant customization is required beyond what `shadcn/ui` allows, create a new custom component. Ensure it follows accessibility best practices, potentially leveraging Radix UI primitives.
*   **Styling:**
    *   **Tailwind CSS Only:** All styling must be done using Tailwind CSS utility classes. Avoid writing custom CSS or using other styling solutions.
    *   **Responsive Design:** Always consider responsiveness using Tailwind's responsive prefixes (e.g., `sm:`, `md:`, `lg:`).
*   **AI Interactions:**
    *   **Google GenAI SDK:** Use the `@google/genai` package for all calls to generative AI models (e.g., text analysis, image generation, video generation).
*   **Routing:**
    *   **React Router:** Manage all application routes and navigation using React Router. Keep route definitions centralized, typically in `src/App.tsx`.
*   **Icons:**
    *   **Lucide React:** Use icons from the `lucide-react` library.
*   **Project Structure:**
    *   **`src/pages/`:** For top-level views or pages of the application.
    *   **`src/components/`:** For reusable UI components.
    *   **`src/utils/`:** For utility functions or helper modules.
    *   **New Components:** Always create new files for new components or hooks, even if small. Avoid adding new components to existing files.