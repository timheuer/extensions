import { useEffect, useState } from "react";
import { useMsal } from "@azure/msal-react";

const WelcomeName = () => {
    const { instance } = useMsal();
    const [name, setName] = useState<string | null>(null);

    const activeAccount = instance.getActiveAccount();
    useEffect(() => {
        if (activeAccount) {
            setName(activeAccount.name?.split(' ')[0] || null);
        } else {
            setName(null);
        }
    }, [activeAccount]);

    if (name) {
        return {name};
    } else {
        return null;
    }
};

export default WelcomeName;