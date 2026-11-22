"use client";
import { useState } from "react";

type Props = { userId: string; username: string; displayName: string | null; avatar: string | null; };

export default function AccountMenu({ userId, username, displayName, avatar }: Props) {
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const avatarUrl = avatar
    ? `https://cdn.discordapp.com/avatars/${userId}/${avatar}.${avatar.startsWith("a_") ? "gif" : "png"}?size=96`
    : "https://cdn.discordapp.com/embed/avatars/0.png";

  return (
    <div className="accountMenu">
      <button className="accountMenuTrigger" type="button" onClick={() => { setOpen(v => !v); setConfirm(false); }} aria-expanded={open} aria-label="Profilmenü öffnen">
        <img className="accountAvatar" src={avatarUrl} alt="" />
        <span>{displayName || username}</span>
      </button>
      {open && (
        <div className="accountMenuPopover" role="dialog" aria-label="Profilmenü">
          {!confirm ? (
            <>
              <strong>{displayName || username}</strong>
              <button type="button" className="accountMenuAction" onClick={() => setConfirm(true)}>Abmelden</button>
            </>
          ) : (
            <>
              <strong>Möchtest du dich wirklich abmelden?</strong>
              <div className="accountMenuChoices">
                <form action="/api/auth/logout" method="post"><button className="accountMenuLogout" type="submit">Ja, abmelden</button></form>
                <button type="button" className="accountMenuCancel" onClick={() => { setConfirm(false); setOpen(false); }}>Abbrechen</button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
