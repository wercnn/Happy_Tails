import './App.css'
import { Routes, Route } from 'react-router-dom'
import WelcomePage from './screens/Auth/welcome/WelcomePage'
import LoginPage from './screens/Auth/login/LoginPage'
import RoleSelect from './screens/Auth/roleSelect/RoleSelect'
import OwnerRegistration from './screens/Auth/ownerRegistration/OwnerRegister'
import MinderRegistration from './screens/Auth/minderRegistration/MinderRegister'

function App() {
  return (
    <Routes>
      <Route path="/" element={<WelcomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RoleSelect />} />
      <Route path="/ownerReg" element={<OwnerRegistration />} />
      <Route path="/minderReg" element={<MinderRegistration />} />
    </Routes>
  )
}

export default App