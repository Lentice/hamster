# Normal-time playtesting and follow-up

2026-11-03. Tested in Chromium at 390 × 844 using real UI clicks/keys and normal game clocks. No score mutation or clock fast-forward was used for these sessions. Separate regression scripts use accelerated clock reads to check settlement reliably.

| Game | Actions | Result |
|---|---|---|
| 點心快遞 | 12 deliveries, including 1 intentional mistake and a recovered streak | 13 points, normal 35-second round |
| 星光尋寶 | 3 complete constellations, including 1 intentional wrong tap | 41 points, normal 45-second round |
| 甜點算算 | 8 solved questions, including 1 incorrect attempt and a recovered five-answer streak | 18 points, normal 45-second round |

Observations guiding the follow-up rounds:

- The mobile arcade placed too much content above its first game cards. Round 19 compacts panels and keeps navigation within thumb reach.
- A timer that starts immediately spends the player's thinking time before their first action. Round 20 starts the three new games on the first input and adds a visible remaining-time bar.
- Delivery feedback should explain a wrong category and make the next streak bonus visible.
- Star boards need a stronger visual sense of progress than dimming completed buttons alone.
- Math mistakes should teach the correction rather than merely disable an option.
- Beginners need a relaxed way to learn without competing for scores or coins.

Screenshots were inspected from the dedicated local test session; generated screenshots and test saves are excluded from Git.
