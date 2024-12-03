import React, { useEffect } from 'react';
import Phaser from 'phaser';
import { GameScene } from './GameScene';

const Game: React.FC = () => {
  useEffect(() => {
    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width: 800,
      height: 600,
      backgroundColor: '#000000',
      parent: 'phaser-container',
      physics: {
        default: 'matter',
        matter: {
          gravity: {
            x: 0.5,
            y: 0.8,
          },
          enableSleeping: true,
          debug: false,
        },
      },
      scene: GameScene,
    };

    const game = new Phaser.Game(config);

    return () => {
      game.destroy(true);
    };
  }, []);

  return <div id="phaser-container" />;
};

export default Game;
