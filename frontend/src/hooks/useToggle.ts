import { useState } from "react";

const useToggle = (initialState: boolean = false) =>{
    const [isToggled, setToggled] = useState<boolean>(initialState);

        const setToggle = (toggleState?: boolean) => {
            if (toggleState) {
                setToggled(toggleState);
            } else {
                setToggled(prev => !prev);
            }
        }

    return [isToggled, setToggle] as const;
}

export default useToggle;