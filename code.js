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
const { useSyncedState, useSyncedMap, usePropertyMenu, AutoLayout, Text, SVG, Frame, Ellipse, useEffect, Rectangle, useWidgetId, waitForTask, } = widget;
const FRAME_WIDTH = 700;
const FRAME_HEIGHT = 400;
const BALL_DIAMETER = 50;
const BALL_RADIUS = BALL_DIAMETER / 2;
const INITIAL_X = FRAME_WIDTH / 2 - BALL_RADIUS;
const INITIAL_Y = FRAME_HEIGHT / 2 - BALL_RADIUS;
const INITIAL_VX = 10;
const INITIAL_VY = -10;
const PADDLE_INITIAL_X = FRAME_WIDTH / 2;
const PADDLE_HEIGHT = FRAME_HEIGHT / 8;
const PADDLE_WIDTH = FRAME_WIDTH / 4;
const PADDLE_DELTA = 50;
const DEBOUNCE_INTERVAL_MS = 25;
var GAME_STATE;
(function (GAME_STATE) {
    GAME_STATE[GAME_STATE["RUNNING"] = 0] = "RUNNING";
    GAME_STATE[GAME_STATE["DONE"] = 1] = "DONE";
})(GAME_STATE || (GAME_STATE = {}));
var USER_ACTION;
(function (USER_ACTION) {
    USER_ACTION[USER_ACTION["LEAVE"] = 0] = "LEAVE";
    USER_ACTION[USER_ACTION["JOIN"] = 1] = "JOIN";
})(USER_ACTION || (USER_ACTION = {}));
var PADDLE_POSITION;
(function (PADDLE_POSITION) {
    PADDLE_POSITION[PADDLE_POSITION["TOP"] = 0] = "TOP";
    PADDLE_POSITION[PADDLE_POSITION["BOTTOM"] = 1] = "BOTTOM";
})(PADDLE_POSITION || (PADDLE_POSITION = {}));
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
    const widgetId = useWidgetId();
    const { x, y } = position;
    const { vx, vy } = velocity;
    const currentPlayerKey = `${figma.currentUser.sessionId}`;
    const shouldDebounce = (prevPingTime, currentPingTime) => {
        return currentPingTime - prevPingTime < DEBOUNCE_INTERVAL_MS;
    };
    const isUserHoveringInsideWidget = (widget, userPosition) => {
        // We only care about x positioning and whether the user's cursor is inside the widget
        // Get the widget's nodeID and figure out its position on the canvas
        // Query the user's position (active users) and see if the cursor is within the widget
        return (userPosition.x <= widget.x + widget.width &&
            userPosition.x >= widget.x &&
            userPosition.y >= widget.y &&
            userPosition.y <= widget.y + widget.height);
    };
    useEffect(() => {
        // Update pong paddle based on user 'cursor'
        const widgetNode = figma.getNodeById(widgetId);
        figma.activeUsers.map((a) => {
            const pKey = `${a.sessionId}`;
            const maybePos = players.get(pKey);
            if (maybePos) {
                if ((maybePos === null || maybePos === void 0 ? void 0 : maybePos.cursor_x) === -1) {
                    players.set(pKey, {
                        paddle_x: maybePos === null || maybePos === void 0 ? void 0 : maybePos.paddle_x,
                        cursor_x: a.position.x,
                        paddle_position: maybePos.paddle_position,
                    });
                }
                else {
                    if (isUserHoveringInsideWidget(widgetNode, a.position)) {
                        const didMoveRight = (maybePos === null || maybePos === void 0 ? void 0 : maybePos.cursor_x) - a.position.x < 0;
                        const didMoveLeft = (maybePos === null || maybePos === void 0 ? void 0 : maybePos.cursor_x) - a.position.x > 0;
                        if (didMoveLeft || didMoveRight) {
                            const newPaddleX = didMoveLeft
                                ? Math.max(1, (maybePos === null || maybePos === void 0 ? void 0 : maybePos.paddle_x) - PADDLE_DELTA)
                                : Math.min(FRAME_WIDTH - PADDLE_WIDTH, (maybePos === null || maybePos === void 0 ? void 0 : maybePos.paddle_x) + PADDLE_DELTA);
                            const newPlayerObj = {
                                paddle_x: newPaddleX,
                                cursor_x: a.position.x,
                                paddle_position: maybePos.paddle_position,
                            };
                            players.set(pKey, newPlayerObj);
                        }
                        // Don't update otherwise
                    }
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
                let didCollideWithPaddle = false;
                // Check for paddle collision
                players.entries().map((e) => {
                    const [_, player] = e;
                    const overlapsX = x + vx >= player.paddle_x &&
                        x + vx <= player.paddle_x + PADDLE_WIDTH;
                    let overlapsY = false;
                    if (player.paddle_position === PADDLE_POSITION.BOTTOM) {
                        overlapsY = y + vy > FRAME_HEIGHT - BALL_DIAMETER - PADDLE_HEIGHT;
                    }
                    else if (player.paddle_position === PADDLE_POSITION.TOP) {
                        overlapsY = y + vy <= PADDLE_HEIGHT;
                    }
                    didCollideWithPaddle = overlapsX && overlapsY;
                });
                if (didCollideWithPaddle) {
                    newVX = -vx;
                    newVY = -vy;
                }
                else {
                    // Check for wall collision
                    if (x + vx > FRAME_WIDTH - BALL_DIAMETER || x + vx <= 0) {
                        newVX = -vx;
                    }
                    if (y + vy > FRAME_HEIGHT - BALL_DIAMETER || y + vy <= 0) {
                        newVY = -vy;
                    }
                }
                const newX = x + newVX;
                const newY = y + newVY;
                setPosition({ x: newX, y: newY });
                setVelocity({ vx: newVX, vy: newVY });
                setLastPingTime(currentPingTime);
            }
        };
    });
    const getAction = (playerKey, players) => {
        if (players.get(playerKey) !== undefined) {
            return USER_ACTION.LEAVE;
        }
        return USER_ACTION.JOIN;
    };
    const transitionGameState = (action) => {
        if (action === USER_ACTION.JOIN) {
            return GAME_STATE.RUNNING;
        }
        if (action === USER_ACTION.LEAVE) {
            return players.size === 0 ? GAME_STATE.DONE : GAME_STATE.RUNNING;
        }
        return GAME_STATE.DONE;
    };
    const toggleGame = () => __awaiter(this, void 0, void 0, function* () {
        const action = getAction(currentPlayerKey, players);
        // Update `players`
        switch (action) {
            case USER_ACTION.JOIN:
                if (players.size < 2) {
                    figma.notify(`${figma.currentUser.name} has joined the game`);
                    const occupied = new Set();
                    players.entries().map(([_, player]) => {
                        occupied.add(player.paddle_position);
                    });
                    const paddlePosition = occupied.size === 0
                        ? PADDLE_POSITION.BOTTOM
                        : occupied.has(PADDLE_POSITION.BOTTOM)
                            ? PADDLE_POSITION.TOP
                            : PADDLE_POSITION.BOTTOM;
                    players.set(currentPlayerKey, {
                        paddle_x: PADDLE_INITIAL_X,
                        cursor_x: -1,
                        paddle_position: paddlePosition,
                    });
                }
                else {
                    figma.notify("Only two players allowed 😏");
                }
                break;
            case USER_ACTION.LEAVE:
                players.delete(currentPlayerKey);
                figma.notify(`${figma.currentUser.name} has left the game`);
                break;
        }
        // Update game state
        const newGameState = transitionGameState(action);
        setGameState(newGameState);
        switch (newGameState) {
            case GAME_STATE.RUNNING:
                // Start ball animation from iframe
                return new Promise((resolve) => {
                    figma.showUI(__html__, { visible: false });
                });
                break;
            case GAME_STATE.DONE:
                // Reset some state
                setPosition({ x: INITIAL_X, y: INITIAL_Y });
                figma.closePlugin();
                break;
        }
    });
    /*
      [TODOs]
      * Perf!
        * Cursor movt synced with paddle movt smoothing
        * Ball movt not jittery
    */
    const GameFrame = (paddles) => {
        return (figma.widget.h(AutoLayout, { direction: "horizontal", verticalAlignItems: "center", horizontalAlignItems: "center", onClick: toggleGame, fill: "#0073cf" },
            figma.widget.h(Frame, { width: FRAME_WIDTH, height: FRAME_HEIGHT },
                gameState !== GAME_STATE.RUNNING && (figma.widget.h(Text, { verticalAlignText: "center", horizontalAlignText: "center", fontSize: 48, x: FRAME_WIDTH / 2, y: 30 }, "🏓 Give me a click 🏓")),
                gameState === GAME_STATE.RUNNING && (figma.widget.h(Text, { verticalAlignText: "center", horizontalAlignText: "center", fontSize: 48, x: FRAME_WIDTH / 2, y: FRAME_HEIGHT / 2 }, "🏓 Click anytime to leave 🏓")),
                figma.widget.h(Ellipse, { fill: "#FFFF00", x: x, y: y, width: BALL_DIAMETER, height: BALL_DIAMETER }),
                paddles)));
    };
    const paddles = players.entries().map(([sessionID, player]) => {
        return (figma.widget.h(Rectangle, { key: sessionID, fill: "#FF0000", width: PADDLE_WIDTH, height: PADDLE_HEIGHT, x: player === null || player === void 0 ? void 0 : player.paddle_x, y: (player === null || player === void 0 ? void 0 : player.paddle_position) === PADDLE_POSITION.BOTTOM
                ? FRAME_HEIGHT - PADDLE_HEIGHT
                : 0 }));
    });
    return GameFrame(paddles);
}
widget.register(Widget);
