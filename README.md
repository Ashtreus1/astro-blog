# ChatDesk: Documentation

Welcome to the official documentation for ChatDesk. Here you will find all the information you need to understand, run, and contribute to this project.

## About the Project

ChatDesk is a web application that serves as a customer support platform. Its main features are:

*   **Ticket Request:** Users can fill out a form to request support for their issues.
*   **Live Chat:** Once a ticket is created, a chat room is generated where the user can communicate with a support agent (or an AI bot).
*   **Help Center/Blogs:** There is also a section for articles or blogs that can contain frequently asked questions (FAQs) or guides for users.

## Technologies Used

The following are the main technologies used in the development of ChatDesk:

*   **Framework:** [Astro](https://astro.build/) - Used as the main framework for the web application.
*   **UI Library:** [React](https://react.dev/) - Used for interactive components such as the chat panel and modals.
*   **Styling:** [Tailwind CSS](https://tailwindcss.com/) - For fast and custom styling of components.
*   **Backend & Database:** [Supabase](https://supabase.com/) - Used for the database (storing tickets and messages) and real-time capabilities.
*   **AI Chat:** [Together AI](https://www.together.ai/) - Used to generate responses from the AI bot.
*   **State Management:** [Zustand](https://zustand-demo.pmnd.rs/) - A small and fast state management library for React.

## Getting Started

To run the project on your local machine, follow these steps:

1.  **Clone the Repository:**
    ```bash
    git clone <repository-url>
    cd chatdesk
    ```

2.  **Install Dependencies:**
    Make sure you have Node.js installed. Then, run this command in the project's root directory.
    ```bash
    npm install
    ```

3.  **Set up Environment Variables:**
    This project requires an API key for Together AI. Create a `.env` file in the root directory and add your key:
    ```
    TOGETHER_API_KEY="your-api-key"
    ```

4.  **Run the Development Server:**
    ```bash
    npm run dev
    ```
    You can now open your browser and go to `http://localhost:4321` to see the application.

## Project Structure

This is an overview of the important folders and files within the project:

```
/
├── public/             # Static assets like images and scripts.
├── src/
│   ├── components/     # Reusable UI components (Astro).
│   ├── content/        # Content collections (Markdown files for blogs).
│   ├── layouts/        # Main page layouts.
│   ├── lib/            # Helpers, client initializations (Supabase), and state management (Zustand).
│   ├── pages/          # Application routes (Astro pages).
│   │   └── api/        # Routes for API endpoints.
│   ├── react-components/ # Reusable UI components (React).
│   └── styles/         # Global CSS.
├── astro.config.mjs    # Configuration file for Astro.
└── package.json        # List of project dependencies and scripts.
```

## How to Contribute

If you want to contribute to this project, here are some ways:

### 1. Adding a New Article/Blog

*   Go to `src/content/articles/`.
*   Create a new `.md` (Markdown) file.
*   Follow the format of existing articles, including frontmatter for `title`, `description`, and `tags`.
*   It will automatically appear on the `/blogs` page.

### 2. Adding a New React Component

*   Create a new `.tsx` file inside `src/react-components/`.
*   Import and use it in an Astro page (`.astro`) in `src/pages/`.
*   Don't forget to add the `client:load` directive to your component tag to make it interactive. Example: `<MyComponent client:load />`.

### 3. Modifying Pages

*   The pages are located in `src/pages/`. These are `.astro` files.
*   You can edit existing pages or add a new one by creating a new `.astro` file.

Thank you for your interest in ChatDesk!
