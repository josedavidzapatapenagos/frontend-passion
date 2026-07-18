import { NotificationCard, type NotificationItem } from "./NotificationCard";

type Props = {
  current: NotificationItem | null;
  onExited: () => void;
};

export const NotificationContainer = ({ current, onExited }: Props) => {
  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-[95] flex justify-center px-4">
      <div className="w-full max-w-xl">
        {current ? <NotificationCard key={current.id} item={current} onExited={onExited} /> : null}
      </div>
    </div>
  );
};
