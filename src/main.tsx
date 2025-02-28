import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.tsx";
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import { Amplify } from "aws-amplify";
import outputs from "../amplify_outputs.json";
import '@aws-amplify/ui-react/styles.css';
import { Authenticator } from "@aws-amplify/ui-react";
import './styles/sidebar.css';
import './styles/dragdrop.css';
import './styles/admin.css';
import './styles/foldergrid.css';

Amplify.configure(outputs);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Authenticator hideSignUp={false}>
        <App />
      </Authenticator>
    </BrowserRouter>
  </React.StrictMode>
);