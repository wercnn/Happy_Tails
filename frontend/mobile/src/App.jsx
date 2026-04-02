import './App.css'
import { Routes, Route } from 'react-router-dom'
import WelcomePage from './screens/Auth/welcome/WelcomePage'
import LoginPage from './screens/Auth/login/LoginPage'
import RoleSelect from './screens/Auth/roleSelect/RoleSelect'

function App() {
  return (
    <Routes>
      <Route path="/" element={<WelcomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RoleSelect />} />
    </Routes>
  )
}

export default App