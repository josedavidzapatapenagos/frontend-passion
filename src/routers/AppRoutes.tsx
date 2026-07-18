import { Routes, Route } from "react-router-dom";

import MainLayout from "../layouts/MainLayout";

import { LoginPage } from "../pages/LoginPage";
import { RegisterPage } from "../pages/RegisterPage";
import { RegisterOptionsPage } from "../pages/RegisterOptionsPage";
import { VerifyEmailPage } from "../pages/VerifyEmailPage";

import { SelectCountryPage } from "../pages/SelectCountryPage";
import { AgeVerificationPage } from "../pages/AgeVerificationPage";

import { FeedPage } from "../pages/FeedPage";
import { AccountPage } from "../pages/AccountPage";
import { AdminIdentityVerificationsPage } from "../pages/AdminIdentityVerificationsPage";
import { AdminAdsManagementPage } from "../pages/admin/AdminAdsManagementPage";
import { ModelProfilePage } from "../pages/model/ModelProfilePage";
import { ModelAdsPage } from "../pages/model/ModelAdsPage";
import { CreateModelAdPage } from "../pages/model/CreateModelAdPage";
import { ModelProfilePhotosPage } from "../pages/model/ModelProfilePhotosPage";
import {
  AccountTypeGuard,
  AgeGuard,
  AuthGuard,
  CountryGuard,
  InitialRouteRedirect,
  ProfileGuard,
} from "./routeGuards";

export function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/"
        element={<InitialRouteRedirect />}
      />

      <Route
        path="/select-country"
        element={<SelectCountryPage />}
      />

      <Route element={<CountryGuard />}>
        <Route
          path="/age-verification"
          element={<AgeVerificationPage />}
        />
        <Route element={<AgeGuard />}>
          <Route
            path="/login"
            element={<LoginPage />}
          />

          <Route
            path="/register"
            element={<RegisterOptionsPage />}
          />

          <Route
            path="/register-model"
            element={<RegisterPage />}
          />

          <Route
            path="/register-vip"
            element={
              <div className="min-h-screen vp-page-bg flex items-center justify-center vp-text-primary">
                Registro VIP pr\u00f3ximamente
              </div>
            }
          />

          <Route
            path="/verify-email"
            element={<VerifyEmailPage />}
          />

          <Route element={<MainLayout />}>
            <Route
              path="/feed"
              element={<FeedPage />}
            />

            <Route element={<AuthGuard />}>
              <Route
                path="/account"
                element={<AccountPage />}
              />

              <Route element={<AccountTypeGuard allowed={["MODEL"]} />}>
                <Route
                  path="/profile"
                  element={<ModelProfilePage />}
                />

                <Route element={<ProfileGuard />}>
                  <Route
                    path="/profile/photos"
                    element={<ModelProfilePhotosPage />}
                  />

                  <Route
                    path="/ads"
                    element={<ModelAdsPage />}
                  />

                  <Route
                    path="/ads/create"
                    element={<CreateModelAdPage />}
                  />

                  <Route
                    path="/vip"
                    element={
                      <div className="min-h-screen p-8 vp-text-primary">
                        Area VIP
                      </div>
                    }
                  />
                </Route>
              </Route>

              <Route
                path="/premium"
                element={
                  <div className="min-h-screen p-8 vp-text-primary">
                    Premium
                  </div>
                }
              />

              <Route
                path="/favorites"
                element={
                  <div className="min-h-screen p-8 vp-text-primary">
                    Favoritos
                  </div>
                }
              />

              <Route element={<AccountTypeGuard allowed={["ADMIN", "SUPER_ADMIN"]} />}>
                <Route
                  path="/admin/ads"
                  element={<AdminAdsManagementPage />}
                />

                <Route
                  path="/admin/plans"
                  element={
                    <div className="min-h-screen p-8 vp-text-primary">
                      Administracion planes de posicionamiento
                    </div>
                  }
                />

                <Route
                  path="/admin/models"
                  element={
                    <div className="min-h-screen p-8 vp-text-primary">
                      Modelos
                    </div>
                  }
                />

                <Route
                  path="/admin/identity-verifications/pending"
                  element={<AdminIdentityVerificationsPage />}
                />
              </Route>
            </Route>
          </Route>
        </Route>
      </Route>

    </Routes>
  );
}