// pong widget that lets two people play pong

const { widget } = figma
const {
  useSyncedState,
  useSyncedMap,
  usePropertyMenu,
  AutoLayout,
  Text,
  SVG,
  Frame,
  Ellipse,
  useEffect,
  Rectangle,
  useWidgetId,
  waitForTask,
} = widget

const FRAME_WIDTH = 700
const FRAME_HEIGHT = 400

const BALL_DIAMETER = 50
const BALL_RADIUS = BALL_DIAMETER / 2

const INITIAL_X = FRAME_WIDTH / 2 - BALL_RADIUS
const INITIAL_Y = FRAME_HEIGHT / 2 - BALL_RADIUS

const INITIAL_VX = 0 // TODO: change this back
const INITIAL_VY = -10

const PADDLE_INITIAL_X = FRAME_WIDTH / 2
const PADDLE_HEIGHT = FRAME_HEIGHT / 8
const PADDLE_WIDTH = FRAME_WIDTH / 4

const PADDLE_DELTA = 50

const DEBOUNCE_INTERVAL_MS = 25

enum GAME_STATE {
  RUNNING,
  DONE,
}

enum USER_ACTION {
  LEAVE,
  JOIN,
}

enum PADDLE_POSITION {
  TOP,
  BOTTOM,
}

type PlayerObject = {
  paddle_x: number
  cursor_x: number
  paddle_position: PADDLE_POSITION
}

function Widget() {
  // Ball state
  const [position, setPosition] = useSyncedState("position", {
    x: INITIAL_X,
    y: INITIAL_Y,
  })
  const [velocity, setVelocity] = useSyncedState("velocity", {
    vx: INITIAL_VX,
    vy: INITIAL_VY,
  })

  // General game state
  const [gameState, setGameState] = useSyncedState("gamestate", GAME_STATE.DONE)
  const [lastPingTime, setLastPingTime] = useSyncedState("pingtime", 0)
  const [iframePromise, setIFramePromise] = useSyncedState<Promise<any>>(
    "iframe",
    null
  )
  const players = useSyncedMap<PlayerObject>("playerMap")

  // Widget info
  const widgetId = useWidgetId()

  const { x, y } = position
  const { vx, vy } = velocity

  const currentPlayerKey = `${figma.currentUser.sessionId}`

  const shouldDebounce = (prevPingTime: number, currentPingTime: number) => {
    return currentPingTime - prevPingTime < DEBOUNCE_INTERVAL_MS
  }

  const isUserHoveringInsideWidget = (
    widget: WidgetNode,
    userPosition: Vector
  ) => {
    // We only care about x positioning and whether the user's cursor is inside the widget
    // Get the widget's nodeID and figure out its position on the canvas
    // Query the user's position (active users) and see if the cursor is within the widget
    return (
      userPosition.x <= widget.x + widget.width &&
      userPosition.x >= widget.x &&
      userPosition.y >= widget.y &&
      userPosition.y <= widget.y + widget.height
    )
  }

  useEffect(() => {
    // Update pong paddle based on user 'cursor'
    const widgetNode = figma.getNodeById(widgetId) as WidgetNode
    figma.activeUsers.map((a) => {
      const pKey = `${a.sessionId}`
      const maybePos = players.get(pKey) as PlayerObject
      if (maybePos) {
        if (maybePos?.cursor_x === -1) {
          players.set(pKey, {
            paddle_x: maybePos?.paddle_x,
            cursor_x: a.position.x,
            paddle_position: maybePos.paddle_position,
          } as PlayerObject)
        } else {
          if (isUserHoveringInsideWidget(widgetNode, a.position)) {
            const didMoveRight = maybePos?.cursor_x - a.position.x < 0
            const didMoveLeft = maybePos?.cursor_x - a.position.x > 0
            if (didMoveLeft || didMoveRight) {
              const newPaddleX = didMoveLeft
                ? Math.max(1, maybePos?.paddle_x - PADDLE_DELTA)
                : Math.min(
                    FRAME_WIDTH - PADDLE_WIDTH,
                    maybePos?.paddle_x + PADDLE_DELTA
                  )
              const newPlayerObj = {
                paddle_x: newPaddleX,
                cursor_x: a.position.x,
                paddle_position: maybePos.paddle_position,
              } as PlayerObject
              players.set(pKey, newPlayerObj)
            }
            // Don't update otherwise
          }
        }
      }
    })

    // Update ball positioning and velocity.
    // Basic collision detection.
    figma.ui.onmessage = (message) => {
      const currentPingTime = Date.now()
      if (
        message === "ping" &&
        !shouldDebounce(lastPingTime, currentPingTime)
      ) {
        // Update ball
        let newVX = vx
        let newVY = vy

        let didCollideWithPaddle = false

        // Check for paddle collision
        players.entries().map((e) => {
          const [_, player] = e
          const overlapsX =
            x + vx >= player.paddle_x &&
            x + vx <= player.paddle_x + PADDLE_WIDTH

          let overlapsY = false
          if (player.paddle_position === PADDLE_POSITION.BOTTOM) {
            overlapsY = y + vy > FRAME_HEIGHT - BALL_DIAMETER - PADDLE_HEIGHT
          } else if (player.paddle_position === PADDLE_POSITION.TOP) {
            overlapsY = y + vy <= PADDLE_HEIGHT
          }
          didCollideWithPaddle = overlapsX && overlapsY
        })

        if (didCollideWithPaddle) {
          newVX = -vx
          newVY = -vy
        } else {
          // Check for wall collision
          if (x + vx > FRAME_WIDTH - BALL_DIAMETER || x + vx <= 0) {
            newVX = -vx
          }
          if (y + vy > FRAME_HEIGHT - BALL_DIAMETER || y + vy <= 0) {
            newVY = -vy
          }
        }

        const newX = x + newVX
        const newY = y + newVY

        setPosition({ x: newX, y: newY })
        setVelocity({ vx: newVX, vy: newVY })
        setLastPingTime(currentPingTime)
      }
    }
  })

  const getAction = (playerKey: string, players: SyncedMap): USER_ACTION => {
    if (players.get(playerKey) !== undefined) {
      return USER_ACTION.LEAVE
    }
    return USER_ACTION.JOIN
  }

  const transitionGameState = (action: USER_ACTION): GAME_STATE => {
    if (action === USER_ACTION.JOIN) {
      return GAME_STATE.RUNNING
    }

    if (action === USER_ACTION.LEAVE) {
      return players.size === 0 ? GAME_STATE.DONE : GAME_STATE.RUNNING
    }

    return GAME_STATE.DONE
  }

  const toggleGame = async () => {
    const action = getAction(currentPlayerKey, players)

    // Update `players`
    switch (action) {
      case USER_ACTION.JOIN:
        if (players.size < 2) {
          figma.notify(`${figma.currentUser.name} has joined the game`)
          const occupied = new Set()
          players.entries().map(([_, player]) => {
            occupied.add(player.paddle_position)
          })
          const paddlePosition =
            occupied.size === 0
              ? PADDLE_POSITION.BOTTOM
              : occupied.has(PADDLE_POSITION.BOTTOM)
              ? PADDLE_POSITION.TOP
              : PADDLE_POSITION.BOTTOM
          players.set(currentPlayerKey, {
            paddle_x: PADDLE_INITIAL_X,
            cursor_x: -1,
            paddle_position: paddlePosition,
          })
        } else {
          figma.notify("Only two players allowed 😏")
        }
        break
      case USER_ACTION.LEAVE:
        players.delete(currentPlayerKey)
        figma.notify(`${figma.currentUser.name} has left the game`)
        break
    }

    // Update game state
    const newGameState = transitionGameState(action)
    setGameState(newGameState)

    switch (newGameState) {
      case GAME_STATE.RUNNING:
        // Start ball animation
        if (iframePromise) return iframePromise
        const promise = new Promise((resolve) => {
          figma.showUI(__html__, { visible: false })
        })
        setIFramePromise(promise) // one per widget, so it doesn't get jittery with multiple users
        return promise
      case GAME_STATE.DONE:
        // Reset some state
        setPosition({ x: INITIAL_X, y: INITIAL_Y })
        if (iframePromise) {
          Promise.resolve(iframePromise)
          setIFramePromise(null)
        }
        figma.closePlugin()
        break
    }
  }

  const GameFrame = (paddles: any) => {
    return (
      <AutoLayout
        direction="horizontal"
        verticalAlignItems="center"
        horizontalAlignItems="center"
        onClick={toggleGame}
        fill="#0073cf"
      >
        <Frame width={FRAME_WIDTH} height={FRAME_HEIGHT}>
          {gameState !== GAME_STATE.RUNNING && (
            <Text
              verticalAlignText="center"
              horizontalAlignText="center"
              fontSize={48}
              x={FRAME_WIDTH / 2}
              y={30}
            >
              {"🏓 Give me a click 🏓"}
            </Text>
          )}
          {gameState === GAME_STATE.RUNNING && (
            <Text
              verticalAlignText="center"
              horizontalAlignText="center"
              fontSize={48}
              x={FRAME_WIDTH / 2}
              y={FRAME_HEIGHT / 2}
            >
              {"🏓 Click anytime to leave 🏓"}
            </Text>
          )}
          <Ellipse
            fill="#FFFF00"
            x={x}
            y={y}
            width={BALL_DIAMETER}
            height={BALL_DIAMETER}
          ></Ellipse>
          {paddles}
        </Frame>
      </AutoLayout>
    )
  }

  const paddles = players.entries().map(([sessionID, player]) => {
    return (
      <Rectangle
        key={sessionID}
        fill="#FF0000"
        width={PADDLE_WIDTH}
        height={PADDLE_HEIGHT}
        x={player?.paddle_x}
        y={
          player?.paddle_position === PADDLE_POSITION.BOTTOM
            ? FRAME_HEIGHT - PADDLE_HEIGHT
            : 0
        }
      ></Rectangle>
    )
  })
  return GameFrame(paddles)
}

widget.register(Widget)
