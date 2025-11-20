import { MaterialIcons } from '@expo/vector-icons';

/**
 * Maps backend icon names (React Icons) to Expo Vector Icons (MaterialIcons)
 */
export const getIconName = (backendIconName) => {
    const iconMap = {
        // FontAwesome mappings
        'FaFaucet': 'water-drop', // Closest match for hydrant/faucet
        'FaHospital': 'local-hospital',
        'FaBuilding': 'location-city',
        'FaGasPump': 'local-gas-station',
        'FaSchool': 'school',
        'FaWater': 'water',
        'FaCar': 'directions-car',
        'FaTree': 'park',
        'FaShoppingCart': 'shopping-cart',

        // Material Design mappings
        'MdLocalFireDepartment': 'local-fire-department',
        'MdPlace': 'place',
        'MdWarning': 'warning',
        'MdWaterDrop': 'water-drop',
        'MdDangerous': 'dangerous',
        'MdElectricBolt': 'electric-bolt',
        'MdSecurity': 'security',
        'MdEmergency': 'emergency',
        'MdPhone': 'phone',
        'MdDirectionsCar': 'directions-car',
        'MdFireExtinguisher': 'fire-extinguisher', // Note: might not exist in all sets, fallback to generic
        'MdLocalPolice': 'local-police',
        'MdLocalAmbulance': 'medical-services', // local-ambulance might not be in MaterialIcons
        'MdLocalGasStation': 'local-gas-station',
        'MdLocalParking': 'local-parking',
        'MdStorage': 'storage',
        'MdBusiness': 'business',
        'MdPerson': 'person',

        // Custom/Specific
        'CustomHydrant': 'water-drop', // Fallback for custom hydrant
    };

    return iconMap[backendIconName] || 'place'; // Default to generic place marker
};

/**
 * Helper to get icon family if we decide to mix families later
 * Currently defaults to MaterialIcons
 */
export const IconFamily = MaterialIcons;
