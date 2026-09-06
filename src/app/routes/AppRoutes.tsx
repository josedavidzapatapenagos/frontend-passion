import { Routes, Route } from "react-router-dom";

import MainLayout from "@/layouts/MainLayout";

import { LoginPage } from "@/features/auth/pages/LoginPage";
import { RegisterPage } from "@/features/auth/pages/RegisterPage";
import { RegisterOptionsPage } from "@/features/auth/pages/RegisterOptionsPage";
import { VerifyEmailPage } from "@/features/auth/pages/VerifyEmailPage";

import { SelectCountryPage } from "@/features/onboarding/pages/SelectCountryPage";
import { AgeVerificationPage } from "@/features/onboarding/pages/AgeVerificationPage";

import { FeedPage } from "@/features/feed/pages/FeedPage";
import { AccountPage } from "@/features/account/pages/AccountPage";
import { AdminIdentityVerificationsPage } from "@/features/admin/pages/AdminIdentityVerificationsPage";
import { AdminAdsManagementPage } from "@/features/admin/pages/AdminAdsManagementPage";
import { AdminPositioningPlansPage } from "@/features/admin/pages/AdminPositioningPlansPage";
import { ModelProfilePage } from "@/features/model-profile/pages/ModelProfilePage";
import { ModelAdsPage } from "@/features/model-ads/pages/ModelAdsPage";
import { CreateModelAdPage } from "@/features/model-ads/pages/CreateModelAdPage";
import { ModelProfilePhotosPage } from "@/features/model-profile/pages/ModelProfilePhotosPage";
import { ModelVipAreaPage } from "@/features/vip-area/pages/ModelVipAreaPage";
import { ModelVipStudioPage } from "@/features/vip-area/pages/ModelVipStudioPage";
import { VipChatPage } from "@/features/vip-area/pages/VipChatPage";
import { PaymentSuccessPage } from "@/features/payments/pages/PaymentSuccessPage";
import { PaymentCancelPage } from "@/features/payments/pages/PaymentCancelPage";
import {
  AccountTypeGuard,
  AgeGuard,
  AuthGuard,
  CountryGuard,
  ProfileGuard,
} from "@/app/routes/routeGuards/index";
import { InitialRouteRedirect } from "@/app/routes/redirects/InitialRouteRedirect";

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

      <Route
        path="/payment/success"
        element={<PaymentSuccessPage />}
      />

      <Route
        path="/payment/cancel"
        element={<PaymentCancelPage />}
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

            <Route
              path="/vip"
              element={<ModelVipAreaPage />}
            />

            <Route
              path="/vip/:vipAreaId"
              element={<ModelVipAreaPage />}
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
                    path="/vip/manage"
                    element={<ModelVipStudioPage />}
                  />

                  <Route
                    path="/vip/:vipAreaId/chat"
                    element={<VipChatPage />}
                  />

                  <Route
                    path="/vip/chat"
                    element={<VipChatPage />}
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
                  element={<AdminPositioningPlansPage />}
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