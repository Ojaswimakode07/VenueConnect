import React, { useState } from "react";

export default function PlaylistBuilder({ playlist, setPlaylist }) {
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");

  function addSong(e) {
    e.preventDefault();
    if (!title.trim()) return;
    setPlaylist([...playlist, { title: title.trim(), artist: artist.trim(), note: "" }]);
    setTitle("");
    setArtist("");
  }

  function removeSong(idx) {
    setPlaylist(playlist.filter((_, i) => i !== idx));
  }

  return (
    <div>
      <p className="text-sm text-gray-500 mb-3">
        Pre-submit songs you'd like the DJ / sound team to play at your event — from the baraat entry to the last dance.
      </p>
      <form onSubmit={addSong} className="flex flex-col sm:flex-row gap-2 mb-4">
        <input
          className="input flex-1"
          placeholder="Song title, e.g. Kesariya"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <input
          className="input flex-1"
          placeholder="Artist (optional)"
          value={artist}
          onChange={(e) => setArtist(e.target.value)}
        />
        <button type="submit" className="btn-primary !py-2 !px-5 text-sm whitespace-nowrap">+ Add Song</button>
      </form>

      {playlist.length === 0 ? (
        <p className="text-xs text-gray-400 text-center py-6 border border-dashed rounded-lg">
          No songs added yet — your playlist is optional but a nice personal touch.
        </p>
      ) : (
        <ul className="space-y-2 max-h-56 overflow-y-auto pr-1">
          {playlist.map((song, idx) => (
            <li key={idx} className="flex items-center justify-between bg-panel rounded-lg px-3 py-2">
              <div>
                <span className="text-xs font-bold text-gold mr-2">#{idx + 1}</span>
                <span className="text-sm font-semibold text-plum-dark">{song.title}</span>
                {song.artist && <span className="text-xs text-gray-400"> — {song.artist}</span>}
              </div>
              <button onClick={() => removeSong(idx)} className="text-gray-400 hover:text-red-500 text-sm">✕</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
