export const getUserMediaStream = async () =>
  await navigator.mediaDevices.getUserMedia({ audio: true, video: true });

/**
 * Redirect to the application root.
 */
export function redirect(): void {
  window.location.replace("/");
}

/**
 * Get the room id from the URL.
 * @returns The room ID.
 */
export function getRoomId(): string {
  const path = window.location.pathname.split("/");
  const room = path[1];

  if (room === undefined || room === "") {
    redirect();
    throw new Error("Undefined room - redirecting now");
  }

  return room;
}

export const addBorder = (peerId: string): void => {
  const userVideo = document.getElementById(peerId);
  if (userVideo) {
    userVideo.style.border = "5px solid #bda400";
  }
};

export const removeBorder = (peerId: string): void => {
  const userVideo = document.getElementById(peerId);
  if (userVideo) {
    userVideo.style.border = "";
  }
};
