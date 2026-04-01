import './App.css'
import WelcomePage from './screens/Auth/welcome/WelcomePage'
import LoginPage from './screens/Auth/login/LoginPage'
import RoleSelect from './screens/Auth/roleSelect/RoleSelect'
import OwnerRegister from './screens/Auth/ownerRegistration/OwnerRegister'
import MinderRegister from './screens/Auth/minderRegistration/MinderRegister'
import OTP from './screens/Auth/otp/OTP'
import OwnwerHome from './screens/Pet Owner - Pets/ownerHome/OwnerHome'
import MyPets from './screens/Pet Owner - Pets/myPets/MyPets'
import CreatePet from './screens/Pet Owner - Pets/createPet/CreatePet'
import PetDetail from './screens/Pet Owner - Pets/petDetail/PetDetail'
import AddHealth from './screens/Pet Owner - Pets/addHealth/AddHealth'
import UploadPhoto from './screens/Pet Owner - Pets/uploadPhoto/UploadPhoto'
import Dashboard from './screens/Pet Minder/dashboard/Dashboard'
import Services from './screens/Pet Minder/services/Service'
import Availability from './screens/Pet Minder/availability/Availability'
import Requests from './screens/Pet Minder/requests/Requests'
import Accept from './screens/Pet Minder/accept/Accept'
import Notifications from './screens/Notifications & Profile/Notifications'

function App() {
  return (
    <div className="app-container">
      <div className="app-row-layout">
        {/* Authentication Screens */}
        <WelcomePage />
        <LoginPage />
        <RoleSelect />
        <OwnerRegister />
        <MinderRegister />
        <OTP />
      </div>
      <div className="app-row-layout">
        {/* Pet Owner Screens */}
        <OwnwerHome />
        <MyPets />
        <CreatePet />
        <PetDetail />
        <AddHealth />
        <UploadPhoto />
      </div>
      <div className="app-row-layout">
        {/* Pet Minder Screens */}
        <Dashboard />
        <Services />
        <Availability />
        <Requests />
        <Accept />
      </div>
      <div className="app-row-layout">
        {/* Notifications & Profile */}
        <Notifications />
        
      </div>
    </div>

    
  )
}

export default App
