import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import { createBrowserRouter, RouterProvider } from 'react-router'
import { ThemeProvider } from '@emotion/react'

const theme = {
  default_colors: {
    dark_grey: "#393E41",
    light_grey: "#CEBEBE",
    white: "#ECE2D0",
    brown: "#BA5A31",
    orange: "#F26419"
  }
}

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    errorElement: <div>404 not found</div>
  }
])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <RouterProvider router={router} />
    </ThemeProvider>
  </StrictMode>,
)
