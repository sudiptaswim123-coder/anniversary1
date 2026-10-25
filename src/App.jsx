
import { useCallback, useEffect, useRef, useState } from "react";
import "./index.css";

const INITIAL_LETTER = `My SONA, 💗

Happy Anniversary, my love!

If I could collect every happy moment we have shared, I would keep them all like little stars in my pocket. You make ordinary days feel special, and even the smallest memories with you mean so much to me.

Thank you for your smile, your kindness, our silly moments, and all the memories we still have waiting for us.

This little game is only a tiny way to show you how special you are to me. I hope we keep making our own adventures, one little moment at a time.

You have a very special place in my heart.

Forever with love,
Your KUCHU 💌`;

const MEMORIES = [
  {
    file: "/photos/WhatsApp Image 2025-02-14 at 16.33.02_36912753.jpg",
    caption: "Our favorite memory 💗",
    note: "A moment to remember",
  },
  {
    file: "/photos/sanjana2.jpeg",
    caption: "Your beautiful Eyes 🌷",
    note: "My happy place",
  },
  {
    file: "/photos/WhatsApp Image 2026-10-25 at 22.32.16.jpeg",
    caption: "Us, being us 🧸",
    note: "A little piece of forever",
  },
  {
    file: "/photos/WhatsApp Image 2025-11-08 at 21.04.31_f33dc30a.jpg",
    caption: "One of my favorite days ✨",
    note: "Always in my heart",
  },
];

const HEARTS = [
  { x: 1, y: 0 },
  { x: 3, y: 1 },
  { x: 1, y: 3 },
  { x: 4, y: 4 },
];

const PUZZLE_ANSWERS = [
  "The little moments we share 💗",
  "Who can collect the most coins",
  "Who finishes first",
];

const SOUND_PATTERNS = {
  click: [{ frequency: 520, delay: 0 }],
  heart: [
    { frequency: 740, delay: 0 },
    { frequency: 980, delay: 0.08 },
  ],
  success: [
    { frequency: 660, delay: 0 },
    { frequency: 880, delay: 0.1 },
    { frequency: 1040, delay: 0.2 },
  ],
  treasure: [
    { frequency: 523, delay: 0 },
    { frequency: 659, delay: 0.12 },
    { frequency: 784, delay: 0.24 },
    { frequency: 1046, delay: 0.36 },
  ],
};

function App() {
  const [screen, setScreen] = useState("start");
  const [player, setPlayer] = useState({ x: 0, y: 0 });
  const [collected, setCollected] = useState([]);
  const [puzzleChoice, setPuzzleChoice] = useState("");
  const [puzzleSolved, setPuzzleSolved] = useState(false);
  const [unlockedPhotos, setUnlockedPhotos] = useState(false);
  const [treasureOpened, setTreasureOpened] = useState(false);
  const [showEditor, setShowEditor] = useState(false);

  const [letter, setLetter] = useState(() => {
    try {
      return (
        localStorage.getItem("sona-kuchu-love-letter") ||
        INITIAL_LETTER
      );
    } catch {
      return INITIAL_LETTER;
    }
  });

  const [soundOn, setSoundOn] = useState(false);
  const [toast, setToast] = useState("");

  const audioContextRef = useRef(null);
  const toastTimerRef = useRef(null);

  const showToast = useCallback((message) => {
    setToast(message);

    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current);
    }

    toastTimerRef.current = window.setTimeout(() => {
      setToast("");
      toastTimerRef.current = null;
    }, 1800);
  }, []);

  // Create small sound effects with the browser's Web Audio API.
  const playSound = useCallback(
    async (type) => {
      if (!soundOn) return;

      const pattern = SOUND_PATTERNS[type];
      if (!pattern) return;

      try {
        const AudioContextClass =
          window.AudioContext || window.webkitAudioContext;

        if (!AudioContextClass) return;

        let audioContext = audioContextRef.current;

        if (!audioContext || audioContext.state === "closed") {
          audioContext = new AudioContextClass();
          audioContextRef.current = audioContext;
        }

        if (audioContext.state === "suspended") {
          await audioContext.resume();
        }

        const startAt = audioContext.currentTime;

        pattern.forEach(({ frequency, delay }) => {
          const oscillator = audioContext.createOscillator();
          const gain = audioContext.createGain();
          const noteStart = startAt + delay;
          const noteEnd = noteStart + 0.16;

          oscillator.type = "sine";
          oscillator.frequency.setValueAtTime(
            frequency,
            noteStart
          );

          gain.gain.setValueAtTime(0.0001, noteStart);
          gain.gain.exponentialRampToValueAtTime(
            0.1,
            noteStart + 0.02
          );
          gain.gain.exponentialRampToValueAtTime(
            0.0001,
            noteEnd
          );

          oscillator.connect(gain);
          gain.connect(audioContext.destination);

          oscillator.start(noteStart);
          oscillator.stop(noteEnd);
        });
      } catch (error) {
        console.warn("Unable to play sound:", error);
      }
    },
    [soundOn]
  );

  useEffect(() => {
    try {
      localStorage.setItem("sona-kuchu-love-letter", letter);
    } catch {
      // The letter remains editable for this visit.
    }
  }, [letter]);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        window.clearTimeout(toastTimerRef.current);
      }

      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, []);

  const startGame = () => {
    playSound("click");
    setScreen("hearts");
    setPlayer({ x: 0, y: 0 });
    setCollected([]);
    showToast("Collect all 4 hearts 💗");
  };

  const resetGame = () => {
    playSound("click");
    setScreen("start");
    setPlayer({ x: 0, y: 0 });
    setCollected([]);
    setPuzzleChoice("");
    setPuzzleSolved(false);
    setUnlockedPhotos(false);
    setTreasureOpened(false);
    setShowEditor(false);
  };

  const movePlayer = useCallback(
    (dx, dy) => {
      if (screen !== "hearts") return;

      const next = {
        x: Math.max(0, Math.min(4, player.x + dx)),
        y: Math.max(0, Math.min(4, player.y + dy)),
      };

      const hitIndex = HEARTS.findIndex(
        (heart, index) =>
          heart.x === next.x &&
          heart.y === next.y &&
          !collected.includes(index)
      );

      setPlayer(next);

      if (hitIndex !== -1) {
        const updated = [...collected, hitIndex];

        setCollected(updated);
        playSound("heart");

        if (updated.length === HEARTS.length) {
          showToast("All hearts collected! Love level complete 💖");
        } else {
          showToast("You found a heart! 💗");
        }
      }
    },
    [screen, player, collected, playSound, showToast]
  );

  const correctPuzzle = (answer) => {
    if (puzzleSolved) return;

    setPuzzleChoice(answer);

    if (answer === PUZZLE_ANSWERS[0]) {
      setPuzzleSolved(true);
      playSound("success");
      showToast("Correct! You know the secret of love ✨");
    } else {
      playSound("click");
    }
  };

  const steps = [
    { id: "start", label: "Start", number: "01" },
    { id: "hearts", label: "Collect", number: "02" },
    { id: "puzzle", label: "Puzzle", number: "03" },
    { id: "memories", label: "Memories", number: "04" },
    { id: "treasure", label: "Treasure", number: "05" },
  ];

  const stepIndex = steps.findIndex((step) => step.id === screen);

  const progress =
    screen === "start"
      ? 0
      : screen === "hearts"
        ? Math.round((collected.length / HEARTS.length) * 25)
        : screen === "puzzle"
          ? 50
          : screen === "memories"
            ? 75
            : 100;

  return (
    <main className="game-shell">
      <div className="sky-decor decor-one" aria-hidden="true">
        ✦
      </div>
      <div className="sky-decor decor-two" aria-hidden="true">
        ♡
      </div>
      <div className="sky-decor decor-three" aria-hidden="true">
        ✧
      </div>

      <header className="topbar">
        <button
          className="wordmark"
          onClick={resetGame}
          aria-label="Back to start"
        >
          <span className="wordmark-heart">♥</span>
          <span>
            SONA <i>×</i> KUCHU
          </span>
        </button>

        <div className="topbar-right">
          <span className="pixel-label">LOVE QUEST · 001</span>

          <button
            className="sound-toggle"
            onClick={() => {
              const nextSoundState = !soundOn;

              setSoundOn(nextSoundState);

              if (nextSoundState) {
                showToast("Sound effects ON 💗");

                // Resume/create audio after this user interaction.
                const AudioContextClass =
                  window.AudioContext || window.webkitAudioContext;

                if (AudioContextClass) {
                  try {
                    if (
                      !audioContextRef.current ||
                      audioContextRef.current.state === "closed"
                    ) {
                      audioContextRef.current = new AudioContextClass();
                    }

                    audioContextRef.current.resume().catch(() => {});
                  } catch (error) {
                    console.warn("Audio is unavailable:", error);
                  }
                }
              } else {
                showToast("Sound effects OFF 🔇");
              }
            }}
            aria-label="Toggle sound setting"
            aria-pressed={soundOn}
          >
            {soundOn ? "♫" : "♪"}{" "}
            <span>{soundOn ? "ON" : "OFF"}</span>
          </button>
        </div>
      </header>

      <section className="game-intro">
        <div className="tiny-badge">
          <span className="status-dot" /> A QUEST MADE JUST FOR YOU
        </div>

        <h1>
          SONA&apos;S <span>LOVE QUEST</span>
        </h1>

        <p className="intro-copy">
          A tiny world, a few little challenges, and one very big reason
          to smile.
          <br className="desktop-break" /> Made with love by your KUCHU. 💗
        </p>
      </section>

      {screen !== "start" && (
        <section className="progress-panel" aria-label="Game progress">
          <div className="progress-topline">
            <span>YOUR LOVE ADVENTURE</span>
            <strong>{progress}% COMPLETE</strong>
          </div>

          <div className="progress-track">
            <div
              className="progress-fill"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="quest-steps">
            {steps.slice(1).map((step, index) => {
              const active = step.id === screen;
              const done = stepIndex > index + 1;

              return (
                <div
                  className={`quest-step ${active ? "active" : ""} ${
                    done ? "done" : ""
                  }`}
                  key={step.id}
                >
                  <span>{done ? "✓" : step.number}</span>
                  <small>{step.label}</small>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <section className="game-card">
        {screen === "start" && (
          <div className="start-screen screen-enter">
            <div className="pixel-cloud cloud-left">☁</div>
            <div className="pixel-cloud cloud-right">☁</div>

            <div className="start-art" aria-hidden="true">
              <div className="orbit orbit-one" />
              <div className="orbit orbit-two" />
              <div className="big-pixel-heart">♥</div>
              <span className="spark spark-a">✦</span>
              <span className="spark spark-b">✧</span>
              <span className="spark spark-c">✦</span>
              <span className="mini-heart mini-a">♥</span>
              <span className="mini-heart mini-b">♥</span>
            </div>

            <div className="level-chip">
              ✧ YOUR STORY BEGINS HERE ✧
            </div>

            <h2>
              Ready, my <em>SONA?</em>
            </h2>

            <p className="screen-copy">
              Follow the hearts, solve a little love puzzle, unlock our
              memories, and discover the treasure waiting at the end.
            </p>

            <button className="main-button" onClick={startGame}>
              <span>START OUR LOVE STORY</span>
              <b>→</b>
            </button>

            <div className="control-hint">
              <span>👆</span> Tap START to begin <i>·</i> No rush, just love
            </div>
          </div>
        )}

        {screen === "hearts" && (
          <div className="level-screen screen-enter">
            <div className="level-heading">
              <span className="level-number">LEVEL 01 / 04</span>
              <span className="collect-counter">
                ♥ {collected.length} / {HEARTS.length}
              </span>
            </div>

            <h2>
              Collect the <em>love hearts</em>
            </h2>

            <p className="screen-copy">
              Find all four hearts hiding in the garden. Move KUCHU&apos;s
              little star around!
            </p>

            <div className="game-board-wrap">
              <div
                className="game-board"
                role="grid"
                aria-label="Heart collection game board"
              >
                {Array.from({ length: 25 }, (_, index) => {
                  const x = index % 5;
                  const y = Math.floor(index / 5);
                  const isPlayer = player.x === x && player.y === y;

                  const heartIndex = HEARTS.findIndex(
                    (heart) => heart.x === x && heart.y === y
                  );

                  const hasHeart =
                    heartIndex !== -1 &&
                    !collected.includes(heartIndex);

                  const wasCollected =
                    heartIndex !== -1 &&
                    collected.includes(heartIndex);

                  return (
                    <div
                      className={`board-cell ${
                        isPlayer ? "player-cell" : ""
                      } ${hasHeart ? "heart-cell" : ""}`}
                      role="gridcell"
                      key={index}
                      onClick={() =>
                        movePlayer(x - player.x, y - player.y)
                      }
                      style={{
                        cursor: "pointer",
                        touchAction: "manipulation",
                      }}
                    >
                      {isPlayer ? (
                        <span className="player-sprite" aria-label="Player">
                          🐰
                        </span>
                      ) : hasHeart ? (
                        <span className="collectible-heart">♥</span>
                      ) : wasCollected ? (
                        <span className="collected-mark">✦</span>
                      ) : (
                        <span className="grass-sparkle">
                          {(index + x) % 4 === 0 ? "✧" : "·"}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="board-legend">
                <span>
                  <b>🐰</b> KUCHU
                </span>
                <span>
                  <b className="legend-heart">♥</b> Heart
                </span>
                <span>
                  <b>✦</b> Collected
                </span>
              </div>
            </div>

            <div className="d-pad" aria-label="Movement controls">
              <button
                className="pad-up"
                onClick={() => movePlayer(0, -1)}
                aria-label="Move up"
              >
                ▲
              </button>

              <button
                className="pad-left"
                onClick={() => movePlayer(-1, 0)}
                aria-label="Move left"
              >
                ◀
              </button>

              <button
                className="pad-center"
                onClick={() => {
                  playSound("click");
                  showToast("You are doing great, SONA! 💗");
                }}
                aria-label="Encouragement"
              >
                ♥
              </button>

              <button
                className="pad-right"
                onClick={() => movePlayer(1, 0)}
                aria-label="Move right"
              >
                ▶
              </button>

              <button
                className="pad-down"
                onClick={() => movePlayer(0, 1)}
                aria-label="Move down"
              >
                ▼
              </button>
            </div>

            <p className="control-hint">
              <span>👆</span> Tap any tile to move KUCHU and collect hearts
            </p>

            {collected.length === HEARTS.length ? (
              <div className="success-panel">
                <h3>All hearts collected! 💖</h3>
                <p>
                  You found every little piece of love. The next clue is
                  waiting!
                </p>

                <button
                  className="main-button"
                  onClick={() => {
                    playSound("click");
                    setScreen("puzzle");
                  }}
                >
                  NEXT LEVEL <b>→</b>
                </button>
              </div>
            ) : (
              <p className="gentle-hint">
                Psst... there are {HEARTS.length - collected.length} heart
                {HEARTS.length - collected.length === 1 ? "" : "s"} left to
                find. 🌷
              </p>
            )}
          </div>
        )}

        {screen === "puzzle" && (
          <div className="level-screen puzzle-screen screen-enter">
            <div className="level-heading">
              <span className="level-number">LEVEL 02 / 04</span>
              <span className="level-icon">🧩</span>
            </div>

            <div className="puzzle-art" aria-hidden="true">
              💌
            </div>

            <h2>
              A tiny <em>love puzzle</em>
            </h2>

            <p className="screen-copy">
              One little question before the memory garden opens...
            </p>

            <div className="question-card">
              <span className="question-mark">?</span>
              <h3>What makes our little world so special?</h3>

              <div className="answer-list">
                {PUZZLE_ANSWERS.map((answer, index) => (
                  <button
                    className={`answer-option ${
                      puzzleChoice === answer ? "selected" : ""
                    } ${
                      puzzleSolved && answer === PUZZLE_ANSWERS[0]
                        ? "correct"
                        : ""
                    }`}
                    key={answer}
                    onClick={() => correctPuzzle(answer)}
                    disabled={puzzleSolved}
                  >
                    <span>{["A", "B", "C"][index]}</span>
                    {answer}
                    {puzzleSolved && index === 0 && <b>✓</b>}
                  </button>
                ))}
              </div>

              {puzzleChoice && !puzzleSolved && (
                <p className="wrong-hint">
                  Almost! Think of the little things that make us, us. Try
                  again 💗
                </p>
              )}

              {puzzleSolved && (
                <div className="success-panel">
                  <h3>You got it! ✨</h3>
                  <p>It has always been the little moments we share.</p>

                  <button
                    className="main-button"
                    onClick={() => {
                      playSound("click");
                      setUnlockedPhotos(true);
                      setScreen("memories");
                    }}
                  >
                    UNLOCK MEMORY GARDEN <b>→</b>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {screen === "memories" && (
          <div className="level-screen memories-screen screen-enter">
            <div className="level-heading">
              <span className="level-number">LEVEL 03 / 04</span>
              <span className="level-icon">📸</span>
            </div>

            <h2>
              Our memory <em>garden</em>
            </h2>

            <p className="screen-copy">
              A little gallery for the moments you never want to forget. Add
              your real photos to make it yours.
            </p>

            <div className="memory-grid">
              {MEMORIES.map((memory, index) => (
                <article
                  className={`memory-card memory-tilt-${index + 1}`}
                  key={memory.file}
                >
                  <div className="memory-photo">
                    <img
                      src={memory.file}
                      alt={memory.caption}
                      onError={(event) => {
                        event.currentTarget.style.display = "none";
                      }}
                    />

                    <div className="memory-placeholder">
                      <span>{["🌷", "🧸", "💗", "✨"][index]}</span>
                      <strong>YOUR PHOTO</strong>
                      <small>
                        {`Memory ${String(index + 1).padStart(2, "0")}`}
                      </small>
                    </div>

                    <span className="photo-sticker">♡</span>
                  </div>

                  <div className="memory-caption">
                    <h3>{memory.caption}</h3>
                    <p>{memory.note}</p>
                  </div>
                </article>
              ))}
            </div>

            {unlockedPhotos && (
              <button
                className="main-button"
                onClick={() => {
                  playSound("click");
                  setScreen("treasure");
                }}
              >
                FIND THE FINAL TREASURE <b>→</b>
              </button>
            )}
          </div>
        )}

        {screen === "treasure" && (
          <div className="level-screen treasure-screen screen-enter">
            <div className="level-heading">
              <span className="level-number">FINAL LEVEL / 04</span>
              <span className="level-icon">🎁</span>
            </div>

            {!treasureOpened ? (
              <>
                <div className="treasure-art" aria-hidden="true">
                  <span className="treasure-glow">✧</span>

                  <div className="treasure-chest">
                    <div className="chest-lid" />
                    <div className="chest-body">
                      <span>♥</span>
                    </div>
                  </div>

                  <span className="treasure-sparkle sparkle-left">✦</span>
                  <span className="treasure-sparkle sparkle-right">✧</span>
                </div>

                <h2>
                  Your final <em>treasure</em>
                </h2>

                <p className="screen-copy">
                  You collected the hearts, solved the puzzle, and found the
                  memories. There is one last thing from KUCHU...
                </p>

                <button
                  className="main-button"
                  onClick={() => {
                    playSound("treasure");
                    setTreasureOpened(true);
                  }}
                >
                  OPEN YOUR LOVE LETTER <b>♡</b>
                </button>
              </>
            ) : (
              <div className="letter-reveal">
                <div className="letter-seal">♥</div>
                <p className="script-note">A letter written just for you</p>

                <h2>
                  Dear <em>SONA,</em>
                </h2>

                <div className="final-letter">{letter}</div>

                <button
                  className="outline-button"
                  onClick={() => {
                    playSound("click");
                    setShowEditor(!showEditor);
                  }}
                >
                  {showEditor ? "CLOSE EDITOR" : "EDIT THIS LETTER ✍️"}
                </button>

                {showEditor && (
                  <div className="letter-editor">
                    <label htmlFor="love-letter">
                      Make these words your own
                    </label>

                    <textarea
                      id="love-letter"
                      value={letter}
                      onChange={(event) => setLetter(event.target.value)}
                      rows={12}
                    />

                    <p>Your letter is saved in this browser on this device.</p>
                  </div>
                )}

                <div className="final-signature">
                  <span>Made with all my love,</span>
                  <strong>Your KUCHU ♡</strong>
                </div>

                <div className="completion-stamp">
                  QUEST COMPLETE <span>♥</span>
                </div>

                <button className="replay-button" onClick={resetGame}>
                  ↻ PLAY OUR STORY AGAIN
                </button>
              </div>
            )}
          </div>
        )}
      </section>

      <footer className="footer">
        <div className="footer-hearts">♡ ♥ ♡</div>
        <p>Built with pixels, petals, and a whole lot of love.</p>
        <strong>
          SONA <span>♡</span> KUCHU
        </strong>
        <small>Our story is the sweetest quest of all. ✨</small>
      </footer>

      {toast && (
        <div className="toast-message" role="status">
          {toast}
        </div>
      )}
    </main>
  );
}

export default App;
