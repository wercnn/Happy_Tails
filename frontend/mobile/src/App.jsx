import './App.css'
import { Routes, Route } from 'react-router-dom'

/* Authentication screens */
import WelcomePage from './screens/Auth/welcome/WelcomePage'
import LoginPage from './screens/Auth/login/LoginPage'
import RoleSelect from './screens/Auth/roleSelect/RoleSelect'
import OwnerRegistration from './screens/Auth/ownerRegistration/OwnerRegister'
import MinderRegistration from './screens/Auth/minderRegistration/MinderRegister'
import OTP from './screens/Auth/otp/OTP'
import Identity from './screens/Auth/identity/identity'

/* Pet Minder screens */
import MindDash from './screens/Pet Minder/dashboard/Dashboard'
import MindService from './screens/Pet Minder/services/Service'
import MindAvailability from './screens/Pet Minder/availability/Availability'
import MindRequests from './screens/Pet Minder/requests/Requests'

/* Pet Owner screens */
import OwnerDash from './screens/Pet Owner - Pets/ownerHome/OwnerHome'
import OwnerPets from './screens/Pet Owner - Pets/myPets/MyPets'
import OwnerSearch from './screens/Search & Discovery/searchMinders/SearchMinders'
import OwnerBooking from './screens/Booking Flow/history/History'

/* Pet Minder and Pet Owner profile screens */
import Profile from './screens/profile/ProfileSettings'

function App() {
  return (
    <Routes>
      <Route path="/" element={<WelcomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RoleSelect />} />
      <Route path="/ownerReg" element={<OwnerRegistration />} />
      <Route path="/minderReg" element={<MinderRegistration />} />
      <Route path="/otp" element={<OTP />} />
      <Route path="/identity" element={<Identity />} />

      <Route path="/mindDash" element={<MindDash />} />
      <Route path="/mindService" element={<MindService />} />
      <Route path="/mindAvailability" element={<MindAvailability />} />
      <Route path="/mindRequests" element={<MindRequests />} />

      <Route path="/ownerDash" element={<OwnerDash />} />
      <Route path="/ownerPets" element={<OwnerPets />} />
      <Route path="/ownerSearch" element={<OwnerSearch />} />
      <Route path="/ownerBooking" element={<OwnerBooking />} />


      <Route path="/profile" element={<Profile />} />
    </Routes>
  )
}

export default App