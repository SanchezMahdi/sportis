export default function IPhoneHeader({ onNavigateProfile, onOpenNotifications }) {
  return (
    <div className="relative mx-4 mt-2 mb-3">
      <div className="relative w-full aspect-[536/83] rounded-full overflow-hidden shadow-md">
        <img
          src="/iphone/header_3d_banner.png"
          alt="Sportis Header"
          className="w-full h-full object-contain"
        />
        {/* Profile Tap Zone */}
        <button
          type="button"
          onClick={onNavigateProfile}
          className="absolute left-0 top-0 bottom-0 w-3/4 opacity-0 cursor-pointer"
          title="Profil ansehen"
        />
        {/* Notification Bell Tap Zone */}
        <button
          type="button"
          onClick={onOpenNotifications}
          className="absolute right-0 top-0 bottom-0 w-1/4 opacity-0 cursor-pointer"
          title="Benachrichtigungen"
        />
      </div>
    </div>
  )
}

