import { Routes, Route } from "react-router-dom";

import MainLayout from "../layouts/MainLayout";

import { LoginPage } from "../pages/LoginPage";
import { RegisterPage } from "../pages/RegisterPage";
import { RegisterOptionsPage } from "../pages/RegisterOptionsPage";
import { VerifyEmailPage } from "../pages/VerifyEmailPage";

import { SelectCountryPage } from "../pages/SelectCountryPage";
import { AgeVerificationPage } from "../pages/AgeVerificationPage";

import { FeedPage } from "../pages/FeedPage";

export function AppRoutes() {
  return (
    <Routes>

      {/* Flujo inicial */}
      <Route
        path="/"
        element={<SelectCountryPage />}
      />

      <Route
        path="/age-verification"
        element={<AgeVerificationPage />}
      />

      {/* Feed */}
      <Route element={<MainLayout />}>
        <Route
          path="/feed"
          element={<FeedPage />}
        />
      </Route>

      {/* Login */}
      <Route
        path="/login"
        element={<LoginPage />}
      />

      <Route
        path="/verify-email"
        element={<VerifyEmailPage />}
      />

      {/* Selección de cuenta */}
      <Route
        path="/register"
        element={<RegisterOptionsPage />}
      />

      {/* Registro de modelo */}
      <Route
        path="/register-model"
        element={<RegisterPage />}
      />

      {/* Registro VIP */}
      <Route
        path="/register-vip"
        element={
          <div className="min-h-screen bg-[#013440] flex items-center justify-center text-white">
            Registro VIP próximamente
          </div>
        }
      />

    </Routes>
  );
}