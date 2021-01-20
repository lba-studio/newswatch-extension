import React from "react";
import { User } from "../../services/auth.service";

function stubFn(): any {
  throw new Error(
    "Function is not implemented in AuthContext. Have you added AuthContextProvider?"
  );
}

export interface ILoginContext {
  user?: User;
  isLoading: boolean;
  logout: () => Promise<void>;
  launchWebAuthFlow: () => Promise<void>;
}
const AuthContext = React.createContext<ILoginContext>({
  isLoading: true,
  logout: stubFn,
  launchWebAuthFlow: stubFn,
});

export default AuthContext;
