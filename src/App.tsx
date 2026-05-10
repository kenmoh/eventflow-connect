import { RouterProvider } from '@tanstack/react-router'
import { getRouter } from './router'

const router = getRouter()

const App = () => <RouterProvider router={router} />

export default App;
