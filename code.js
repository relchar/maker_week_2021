// pong widget that lets two people play pong
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const { widget } = figma;
const { useSyncedState, useSyncedMap, usePropertyMenu, AutoLayout, Text, SVG, Frame, Ellipse, useEffect, } = widget;
const FRAME_WIDTH = 700;
const FRAME_HEIGHT = 400;
const BALL_DIAMETER = 50;
const BALL_RADIUS = BALL_DIAMETER / 2;
const INITIAL_X = FRAME_WIDTH / 2 - BALL_RADIUS;
const INITIAL_Y = FRAME_HEIGHT / 2 - BALL_RADIUS;
const INITIAL_VX = 5;
const INITIAL_VY = -5;
const PADDLE_INITIAL_X = FRAME_WIDTH / 2;
const PADDLE_HEIGHT = 30;
const PADDLE_WIDTH = 100;
const PADDLE_DELTA = 7;
const DEBOUNCE_INTERVAL_MS = 25;
var GAME_STATE;
(function (GAME_STATE) {
    GAME_STATE[GAME_STATE["RUNNING"] = 0] = "RUNNING";
    GAME_STATE[GAME_STATE["DONE"] = 1] = "DONE";
})(GAME_STATE || (GAME_STATE = {}));
const startButton = `<svg width="135" height="92" viewBox="0 0 135 92" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M26.5 13L1 1.5V32L26.5 13Z" fill="#FF0000"/>
  <path d="M31.5 16L48 7.5L57.5 16V47.5L46 61L31.5 47.5V16Z" fill="#FF0000"/>
  <path d="M72.5 51.5L70.5 7.5L79.25 29.5L72.5 51.5Z" fill="#FF0000"/>
  <path d="M104 49V32L116 30L130.5 32L133.5 43L118.5 55L104 49Z" fill="#FF0000"/>
  <path d="M1 62.5V32M1 32V1.5L26.5 13L1 32ZM91 9.5L88 51.5L79.25 29.5M116 3L104 13V32M104 32V49L118.5 55L133.5 43L130.5 32L116 30L104 32ZM79.25 29.5L70.5 7.5L72.5 51.5L79.25 29.5ZM48 7.5L31.5 16V47.5L46 61L57.5 47.5V16L48 7.5Z" stroke="black"/>
  <path d="M11.4416 88.5H12.4984V85.3125H14.4075C16.4402 85.3125 17.3564 84.0767 17.3564 82.5341C17.3564 80.9915 16.4402 79.7727 14.3904 79.7727H11.4416V88.5ZM12.4984 84.375V80.7102H14.3564C15.7754 80.7102 16.3166 81.4858 16.3166 82.5341C16.3166 83.5824 15.7754 84.375 14.3734 84.375H12.4984ZM18.9224 88.5H19.9281V84.358C19.9281 83.4716 20.627 82.8239 21.5815 82.8239C21.85 82.8239 22.127 82.875 22.1951 82.892V81.8693C22.0801 81.8608 21.8159 81.8523 21.6667 81.8523C20.8826 81.8523 20.2008 82.2955 19.9622 82.9432H19.894V81.9545H18.9224V88.5ZM25.9324 88.6364C27.2619 88.6364 28.2335 87.9716 28.5403 86.983L27.5687 86.7102C27.313 87.392 26.7207 87.733 25.9324 87.733C24.752 87.733 23.938 86.9702 23.8912 85.5682H28.6426V85.142C28.6426 82.7045 27.1937 81.8693 25.8301 81.8693C24.0574 81.8693 22.8812 83.267 22.8812 85.2784C22.8812 87.2898 24.0403 88.6364 25.9324 88.6364ZM23.8912 84.6989C23.9593 83.6804 24.6795 82.7727 25.8301 82.7727C26.921 82.7727 27.6199 83.5909 27.6199 84.6989H23.8912ZM34.8088 83.4205C34.4934 82.4915 33.786 81.8693 32.4906 81.8693C31.1099 81.8693 30.0872 82.6534 30.0872 83.7614C30.0872 84.6648 30.6241 85.2699 31.8258 85.5511L32.9167 85.8068C33.5772 85.9602 33.8883 86.2756 33.8883 86.7273C33.8883 87.2898 33.2917 87.75 32.3542 87.75C31.5318 87.75 31.0162 87.3963 30.8372 86.6932L29.8826 86.9318C30.117 88.044 31.0332 88.6364 32.3713 88.6364C33.8926 88.6364 34.9281 87.8054 34.9281 86.6761C34.9281 85.7642 34.3571 85.1889 33.1895 84.9034L32.2179 84.6648C31.4423 84.473 31.0929 84.2131 31.0929 83.7102C31.0929 83.1477 31.6895 82.7386 32.4906 82.7386C33.3684 82.7386 33.7306 83.2244 33.9054 83.6761L34.8088 83.4205ZM41.0783 83.4205C40.763 82.4915 40.0556 81.8693 38.7601 81.8693C37.3794 81.8693 36.3567 82.6534 36.3567 83.7614C36.3567 84.6648 36.8936 85.2699 38.0953 85.5511L39.1863 85.8068C39.8468 85.9602 40.1578 86.2756 40.1578 86.7273C40.1578 87.2898 39.5613 87.75 38.6238 87.75C37.8013 87.75 37.2857 87.3963 37.1067 86.6932L36.1522 86.9318C36.3865 88.044 37.3027 88.6364 38.6408 88.6364C40.1621 88.6364 41.1976 87.8054 41.1976 86.6761C41.1976 85.7642 40.6266 85.1889 39.459 84.9034L38.4874 84.6648C37.7118 84.473 37.3624 84.2131 37.3624 83.7102C37.3624 83.1477 37.959 82.7386 38.7601 82.7386C39.638 82.7386 40.0002 83.2244 40.1749 83.6761L41.0783 83.4205ZM50.7228 83.4205C50.4075 82.4915 49.7001 81.8693 48.4047 81.8693C47.024 81.8693 46.0012 82.6534 46.0012 83.7614C46.0012 84.6648 46.5382 85.2699 47.7399 85.5511L48.8308 85.8068C49.4913 85.9602 49.8024 86.2756 49.8024 86.7273C49.8024 87.2898 49.2058 87.75 48.2683 87.75C47.4458 87.75 46.9302 87.3963 46.7512 86.6932L45.7967 86.9318C46.0311 88.044 46.9473 88.6364 48.2853 88.6364C49.8066 88.6364 50.8422 87.8054 50.8422 86.6761C50.8422 85.7642 50.2711 85.1889 49.1035 84.9034L48.1319 84.6648C47.3564 84.473 47.0069 84.2131 47.0069 83.7102C47.0069 83.1477 47.6035 82.7386 48.4047 82.7386C49.2825 82.7386 49.6447 83.2244 49.8194 83.6761L50.7228 83.4205ZM52.356 90.9545H53.3617V87.4943H53.4469C53.6685 87.8523 54.0946 88.6364 55.356 88.6364C56.9924 88.6364 58.1344 87.3239 58.1344 85.2443C58.1344 83.1818 56.9924 81.8693 55.339 81.8693C54.0605 81.8693 53.6685 82.6534 53.4469 82.9943H53.3276V81.9545H52.356V90.9545ZM53.3446 85.2273C53.3446 83.7614 53.9924 82.7727 55.2196 82.7727C56.498 82.7727 57.1287 83.8466 57.1287 85.2273C57.1287 86.625 56.481 87.733 55.2196 87.733C54.0094 87.733 53.3446 86.7102 53.3446 85.2273ZM61.5946 88.6534C62.7367 88.6534 63.3333 88.0398 63.5378 87.6136H63.589V88.5H64.5946V84.1875C64.5946 82.108 63.0094 81.8693 62.1742 81.8693C61.1855 81.8693 60.0605 82.2102 59.5492 83.4034L60.5037 83.7443C60.7253 83.267 61.2495 82.7557 62.2083 82.7557C63.133 82.7557 63.589 83.2457 63.589 84.0852V84.1193C63.589 84.6051 63.0946 84.5625 61.9015 84.7159C60.687 84.8736 59.3617 85.142 59.3617 86.642C59.3617 87.9205 60.3503 88.6534 61.5946 88.6534ZM61.748 87.75C60.9469 87.75 60.3674 87.392 60.3674 86.6932C60.3674 85.9261 61.0662 85.6875 61.8503 85.5852C62.2765 85.5341 63.4185 85.4148 63.589 85.2102V86.1307C63.589 86.9489 62.9412 87.75 61.748 87.75ZM69.0893 88.6364C70.5382 88.6364 71.4927 87.75 71.6632 86.5909H70.6575C70.47 87.3068 69.8734 87.733 69.0893 87.733C67.8961 87.733 67.1291 86.7443 67.1291 85.2273C67.1291 83.7443 67.9132 82.7727 69.0893 82.7727C69.9757 82.7727 70.5041 83.3182 70.6575 83.9148H71.6632C71.4927 82.6875 70.4529 81.8693 69.0723 81.8693C67.2995 81.8693 66.1234 83.267 66.1234 85.2614C66.1234 87.2216 67.2484 88.6364 69.0893 88.6364ZM75.8777 88.6364C77.2072 88.6364 78.1788 87.9716 78.4856 86.983L77.514 86.7102C77.2583 87.392 76.666 87.733 75.8777 87.733C74.6973 87.733 73.8833 86.9702 73.8365 85.5682H78.5879V85.142C78.5879 82.7045 77.139 81.8693 75.7754 81.8693C74.0027 81.8693 72.8265 83.267 72.8265 85.2784C72.8265 87.2898 73.9856 88.6364 75.8777 88.6364ZM73.8365 84.6989C73.9047 83.6804 74.6248 82.7727 75.7754 82.7727C76.8663 82.7727 77.5652 83.5909 77.5652 84.6989H73.8365ZM86.3393 81.9545H84.9416V80.3864H83.9359V81.9545H82.9473V82.8068H83.9359V86.8977C83.9359 88.0398 84.8564 88.5852 85.7086 88.5852C86.0836 88.5852 86.3223 88.517 86.4586 88.4659L86.2541 87.5625C86.1689 87.5795 86.0325 87.6136 85.8109 87.6136C85.3677 87.6136 84.9416 87.4773 84.9416 86.625V82.8068H86.3393V81.9545ZM90.4409 88.6364C92.2136 88.6364 93.4068 87.2898 93.4068 85.2614C93.4068 83.2159 92.2136 81.8693 90.4409 81.8693C88.6681 81.8693 87.475 83.2159 87.475 85.2614C87.475 87.2898 88.6681 88.6364 90.4409 88.6364ZM90.4409 87.733C89.0943 87.733 88.4806 86.5739 88.4806 85.2614C88.4806 83.9489 89.0943 82.7727 90.4409 82.7727C91.7875 82.7727 92.4011 83.9489 92.4011 85.2614C92.4011 86.5739 91.7875 87.733 90.4409 87.733ZM98.3169 90.9545H99.3226V87.4943H99.4078C99.6294 87.8523 100.056 88.6364 101.317 88.6364C102.953 88.6364 104.095 87.3239 104.095 85.2443C104.095 83.1818 102.953 81.8693 101.3 81.8693C100.021 81.8693 99.6294 82.6534 99.4078 82.9943H99.2885V81.9545H98.3169V90.9545ZM99.3056 85.2273C99.3056 83.7614 99.9533 82.7727 101.181 82.7727C102.459 82.7727 103.09 83.8466 103.09 85.2273C103.09 86.625 102.442 87.733 101.181 87.733C99.9703 87.733 99.3056 86.7102 99.3056 85.2273ZM106.635 79.7727H105.629V88.5H106.635V79.7727ZM110.403 88.6534C111.545 88.6534 112.142 88.0398 112.346 87.6136H112.398V88.5H113.403V84.1875C113.403 82.108 111.818 81.8693 110.983 81.8693C109.994 81.8693 108.869 82.2102 108.358 83.4034L109.312 83.7443C109.534 83.267 110.058 82.7557 111.017 82.7557C111.942 82.7557 112.398 83.2457 112.398 84.0852V84.1193C112.398 84.6051 111.903 84.5625 110.71 84.7159C109.496 84.8736 108.17 85.142 108.17 86.642C108.17 87.9205 109.159 88.6534 110.403 88.6534ZM110.557 87.75C109.756 87.75 109.176 87.392 109.176 86.6932C109.176 85.9261 109.875 85.6875 110.659 85.5852C111.085 85.5341 112.227 85.4148 112.398 85.2102V86.1307C112.398 86.9489 111.75 87.75 110.557 87.75ZM115.652 90.9545C116.56 90.9545 117.199 90.473 117.578 89.4545L120.365 81.9716L119.266 81.9545L117.459 87.1705H117.391L115.584 81.9545H114.493L116.914 88.5341L116.726 89.0455C116.36 90.0426 115.908 90.1364 115.175 89.9489L114.919 90.8352C115.021 90.8864 115.311 90.9545 115.652 90.9545ZM123.025 79.7727H121.866L121.952 86.0455H122.94L123.025 79.7727ZM122.446 88.5682C122.868 88.5682 123.213 88.223 123.213 87.8011C123.213 87.3793 122.868 87.0341 122.446 87.0341C122.024 87.0341 121.679 87.3793 121.679 87.8011C121.679 88.223 122.024 88.5682 122.446 88.5682Z" fill="black"/>
</svg>`;
function Widget() {
    const [position, setPosition] = useSyncedState("position", {
        x: INITIAL_X,
        y: INITIAL_Y,
    });
    const [velocity, setVelocity] = useSyncedState("velocity", {
        vx: INITIAL_VX,
        vy: INITIAL_VY,
    });
    const [gameState, setGameState] = useSyncedState("gamestate", GAME_STATE.DONE);
    const [lastPingTime, setLastPingTime] = useSyncedState("pingtime", 0);
    const players = useSyncedMap("playerMap");
    const { x, y } = position;
    const { vx, vy } = velocity;
    const shouldDebounce = (prevPingTime, currentPingTime) => {
        return currentPingTime - prevPingTime < DEBOUNCE_INTERVAL_MS;
    };
    useEffect(() => {
        // Update pong paddle based on user 'cursor'
        figma.activeUsers.map((a) => {
            const pKey = `${a.sessionId}`;
            const maybePos = players.get(pKey);
            if (maybePos) {
                // We only care about x positioning
                if ((maybePos === null || maybePos === void 0 ? void 0 : maybePos.cursor_x) !== -1) {
                    // user joined and moved their cursor
                    const didMoveRight = (maybePos === null || maybePos === void 0 ? void 0 : maybePos.cursor_x) - a.position.x < 0;
                    const didMoveLeft = (maybePos === null || maybePos === void 0 ? void 0 : maybePos.cursor_x) - a.position.x > 0;
                    if (didMoveLeft) {
                        players.set(pKey, {
                            paddle_x: (maybePos === null || maybePos === void 0 ? void 0 : maybePos.paddle_x) - PADDLE_DELTA,
                            cursor_x: a.position.x,
                        });
                        console.log("moved left");
                    }
                    else if (didMoveRight) {
                        players.set(pKey, {
                            paddle_x: (maybePos === null || maybePos === void 0 ? void 0 : maybePos.paddle_x) + PADDLE_DELTA,
                            cursor_x: a.position.x,
                        });
                        console.log("moved right");
                    }
                    // Don't update otherwise
                }
                else {
                    players.set(pKey, {
                        paddle_x: maybePos === null || maybePos === void 0 ? void 0 : maybePos.paddle_x,
                        cursor_x: a.position.x,
                    });
                }
            }
        });
        figma.ui.onmessage = (message) => {
            // Update game state
            const currentPingTime = Date.now();
            if (message === "ping" &&
                !shouldDebounce(lastPingTime, currentPingTime)) {
                // Update ball
                let newVX = vx;
                let newVY = vy;
                if (x + vx > FRAME_WIDTH - BALL_DIAMETER || x + vx <= 0) {
                    newVX = -vx;
                }
                if (y + vy > FRAME_HEIGHT - BALL_DIAMETER || y + vy <= 0) {
                    newVY = -vy;
                }
                const newX = x + newVX;
                const newY = y + newVY;
                // Update paddle
                setPosition({ x: newX, y: newY });
                setVelocity({ vx: newVX, vy: newVY });
                setLastPingTime(currentPingTime);
            }
        };
    });
    const toggleGame = () => __awaiter(this, void 0, void 0, function* () {
        if (gameState === GAME_STATE.DONE) {
            setGameState(GAME_STATE.RUNNING);
            // Add current player
            const playerKey = `${figma.currentUser.sessionId}`;
            if (players.get(playerKey)) {
                figma.notify("You've already joined 😏");
            }
            else if (players.size < 2) {
                figma.notify(`${figma.currentUser.name} has joined the game`);
                players.set(playerKey, { paddle_x: PADDLE_INITIAL_X, cursor_x: -1 });
            }
            else {
                figma.notify("Only two players allowed 😏");
            }
            // Start ball animation from iframe
            return new Promise((resolve) => {
                figma.showUI(__html__, { visible: false });
            });
        }
        else if (gameState === GAME_STATE.RUNNING) {
            setGameState(GAME_STATE.DONE);
            // Current player is evicted
            const playerKey = `${figma.currentUser.sessionId}`;
            players.delete(playerKey);
            figma.notify(`${figma.currentUser.name} has left the game`);
            // Reset some state
            setPosition({ x: INITIAL_X, y: INITIAL_Y });
            figma.closePlugin();
        }
    });
    return (figma.widget.h(AutoLayout, { direction: "horizontal", verticalAlignItems: "center", horizontalAlignItems: "center", onClick: toggleGame, fill: "#0073cf" },
        figma.widget.h(Frame, { width: FRAME_WIDTH, height: FRAME_HEIGHT },
            gameState !== GAME_STATE.RUNNING && (figma.widget.h(Text, { verticalAlignText: "center", horizontalAlignText: "center", fontSize: 48, x: FRAME_WIDTH / 2, y: 30 }, "🏓 Give me a click 🏓")),
            gameState === GAME_STATE.RUNNING && (figma.widget.h(Text, { verticalAlignText: "center", horizontalAlignText: "center", fontSize: 48, x: FRAME_WIDTH / 2, y: FRAME_HEIGHT / 2 }, "🏓 Click anytime to leave 🏓")),
            figma.widget.h(Ellipse, { fill: "#FFFF00", x: x, y: y, width: BALL_DIAMETER, height: BALL_DIAMETER }))));
}
widget.register(Widget);
