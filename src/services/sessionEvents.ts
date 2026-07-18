export const SESSION_EXPIRED_EVENT = "vp:session-expired";

export const emitSessionExpired = () => {
  window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
};