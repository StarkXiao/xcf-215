import * as PIXI from 'pixi.js'
import type { Element, Rarity } from '@/types'
import { ELEMENT_COLORS, RARITY_COLORS } from '@/types'

export const BEAST_EMOJIS: Record<string, string> = {
  phoenix: '🔥',
  dragon: '🐉',
  turtle: '🐢',
  tiger: '🐅',
  qilin: '🦄',
  fox: '🦊',
  crane: '🦢',
  wolf: '🐺',
  snake: '🐍',
  bear: '🐻',
  fish: '🐉',
  monkey: '🐵'
}

export class BeastSprite extends PIXI.Container {
  private emoji: PIXI.Text
  private glow: PIXI.Graphics
  private particles: PIXI.ParticleContainer | null = null
  private animationSpeed: number = 1
  private floatOffset: number = 0
  private element: Element
  private rarity: Rarity

  constructor(beastId: string, element: Element, rarity: Rarity, size: number = 120) {
    super()
    
    this.element = element
    this.rarity = rarity
    
    this.glow = new PIXI.Graphics()
    this.addChild(this.glow)
    
    const emojiChar = BEAST_EMOJIS[beastId] || '🐾'
    this.emoji = new PIXI.Text(emojiChar, {
      fontSize: size * 0.6,
      fill: 0xffffff,
      stroke: 0x000000,
      strokeThickness: 2,
      fontFamily: 'Arial'
    })
    this.emoji.anchor.set(0.5)
    this.addChild(this.emoji)
    
    this.createParticles()
    this.updateGlow()
  }

  private stringToHex(color: string): number {
    return parseInt(color.replace('#', ''), 16)
  }

  private updateGlow() {
    const color = ELEMENT_COLORS[this.element]
    const rarityColor = RARITY_COLORS[this.rarity]
    
    this.glow.clear()
    
    const radius = 60
    this.glow.beginFill(this.stringToHex(color), 0.3)
    this.glow.drawCircle(0, 0, radius)
    this.glow.endFill()
    
    this.glow.lineStyle(3, this.stringToHex(rarityColor), 0.8)
    this.glow.drawCircle(0, 0, radius + 5)
  }

  private createParticles() {
    this.particles = new PIXI.Container()
    const color = ELEMENT_COLORS[this.element]
    
    for (let i = 0; i < 15; i++) {
      const particle = new PIXI.Graphics()
      particle.beginFill(this.stringToHex(color), 0.8)
      particle.drawCircle(0, 0, 3 + Math.random() * 3)
      particle.endFill()
      
      particle.x = (Math.random() - 0.5) * 100
      particle.y = (Math.random() - 0.5) * 100
      particle.alpha = 0.3 + Math.random() * 0.5
      ;(particle as any).speed = 0.5 + Math.random() * 1
      ;(particle as any).offset = Math.random() * Math.PI * 2
      
      this.particles.addChild(particle)
    }
    
    this.addChild(this.particles)
  }

  update(delta: number) {
    this.floatOffset += delta * 0.05 * this.animationSpeed
    this.emoji.y = Math.sin(this.floatOffset) * 5
    
    if (this.particles) {
      this.particles.children.forEach((particle, i) => {
        const p = particle as any
        p.offset += delta * 0.02 * p.speed
        particle.y += Math.sin(p.offset) * 0.5
        particle.x += Math.cos(p.offset) * 0.3
        particle.alpha = 0.3 + Math.sin(p.offset) * 0.3
        
        if (Math.abs(particle.x) > 60 || Math.abs(particle.y) > 60) {
          particle.x = (Math.random() - 0.5) * 40
          particle.y = 60
        }
      })
    }
    
    const breathScale = 1 + Math.sin(this.floatOffset * 2) * 0.05
    this.emoji.scale.set(breathScale)
  }

  attackAnimation(onComplete?: () => void) {
    this.animationSpeed = 3
    const originalX = this.x
    
    let frame = 0
    const animate = () => {
      frame++
      if (frame < 10) {
        this.x += 8
      } else if (frame < 20) {
        this.x -= 8
      } else {
        this.animationSpeed = 1
        this.x = originalX
        if (onComplete) onComplete()
        return
      }
      requestAnimationFrame(animate)
    }
    animate()
  }

  hurtAnimation() {
    let frame = 0
    const originalAlpha = this.alpha
    
    const animate = () => {
      frame++
      if (frame < 6) {
        this.alpha = frame % 2 === 0 ? 0.3 : 1
        this.x += frame % 2 === 0 ? -3 : 3
      } else {
        this.alpha = originalAlpha
        this.x = 0
        return
      }
      requestAnimationFrame(animate)
    }
    animate()
  }

  setSize(size: number) {
    this.emoji.style.fontSize = size * 0.6
    this.updateGlow()
  }
}

export class BattleScene {
  private app: PIXI.Application
  playerSprite: BeastSprite | null = null
  enemySprite: PIXI.Container | null = null
  private effects: PIXI.Container

  constructor(container: HTMLElement, width: number, height: number) {
    this.app = new PIXI.Application({
      width,
      height,
      backgroundAlpha: 0,
      antialias: true,
      resolution: window.devicePixelRatio || 1
    })
    
    container.appendChild(this.app.view as HTMLCanvasElement)
    
    this.effects = new PIXI.Container()
    this.app.stage.addChild(this.effects)
    
    this.app.ticker.add(this.update.bind(this))
  }

  private stringToHex(color: string): number {
    return parseInt(color.replace('#', ''), 16)
  }

  setBackground(color: string) {
    this.app.renderer.background.color = this.stringToHex(color)
  }

  setPlayerBeast(beastId: string, element: Element, rarity: Rarity) {
    if (this.playerSprite) {
      this.app.stage.removeChild(this.playerSprite)
    }
    
    this.playerSprite = new BeastSprite(beastId, element, rarity, 100)
    this.playerSprite.x = this.app.screen.width * 0.25
    this.playerSprite.y = this.app.screen.height * 0.5
    this.app.stage.addChild(this.playerSprite)
  }

  setEnemy(emoji: string, element: Element) {
    if (this.enemySprite) {
      this.app.stage.removeChild(this.enemySprite)
    }
    
    this.enemySprite = new PIXI.Container()
    
    const glow = new PIXI.Graphics()
    glow.beginFill(this.stringToHex(ELEMENT_COLORS[element]), 0.3)
    glow.drawCircle(0, 0, 50)
    glow.endFill()
    this.enemySprite.addChild(glow)
    
    const text = new PIXI.Text(emoji, {
      fontSize: 60,
      fill: 0xffffff,
      stroke: 0x000000,
      strokeThickness: 2
    })
    text.anchor.set(0.5)
    this.enemySprite.addChild(text)
    
    this.enemySprite.x = this.app.screen.width * 0.75
    this.enemySprite.y = this.app.screen.height * 0.5
    this.app.stage.addChild(this.enemySprite)
  }

  playerAttack(onComplete?: () => void) {
    if (this.playerSprite) {
      this.playerSprite.attackAnimation(() => {
        this.createAttackEffect(this.playerSprite!.x, this.playerSprite!.y, this.enemySprite!.x, this.enemySprite!.y)
        if (onComplete) onComplete()
      })
    }
  }

  enemyAttack() {
    if (this.enemySprite && this.playerSprite) {
      let frame = 0
      const originalX = this.enemySprite.x
      
      const animate = () => {
        frame++
        if (frame < 8) {
          this.enemySprite!.x -= 6
        } else if (frame < 16) {
          this.enemySprite!.x += 6
        } else {
          this.enemySprite!.x = originalX
          this.createAttackEffect(this.enemySprite!.x, this.enemySprite!.y, this.playerSprite!.x, this.playerSprite!.y)
          this.playerSprite?.hurtAnimation()
          return
        }
        requestAnimationFrame(animate)
      }
      animate()
    }
  }

  private createAttackEffect(fromX: number, fromY: number, toX: number, toY: number) {
    const effect = new PIXI.Graphics()
    effect.lineStyle(4, 0xffd700, 1)
    effect.moveTo(0, 0)
    effect.lineTo(toX - fromX, toY - fromY)
    effect.x = fromX
    effect.y = fromY
    this.effects.addChild(effect)
    
    let alpha = 1
    const fade = () => {
      alpha -= 0.1
      effect.alpha = alpha
      if (alpha <= 0) {
        this.effects.removeChild(effect)
        effect.destroy()
      } else {
        requestAnimationFrame(fade)
      }
    }
    setTimeout(fade, 100)
  }

  createDamageText(damage: number, x: number, y: number, isCrit: boolean = false) {
    const text = new PIXI.Text(`-${damage}`, {
      fontSize: isCrit ? 36 : 28,
      fill: isCrit ? 0xff4444 : 0xffff00,
      stroke: 0x000000,
      strokeThickness: 3,
      fontWeight: 'bold'
    })
    text.anchor.set(0.5)
    text.x = x
    text.y = y
    this.effects.addChild(text)
    
    let offsetY = 0
    let alpha = 1
    
    const animate = () => {
      offsetY -= 2
      alpha -= 0.02
      text.y = y + offsetY
      text.alpha = alpha
      
      if (alpha <= 0) {
        this.effects.removeChild(text)
        text.destroy()
      } else {
        requestAnimationFrame(animate)
      }
    }
    animate()
  }

  private update(delta: number) {
    if (this.playerSprite) {
      this.playerSprite.update(delta)
    }
    
    if (this.enemySprite) {
      this.enemySprite.y = this.app.screen.height * 0.5 + Math.sin(Date.now() * 0.003) * 5
    }
  }

  resize(width: number, height: number) {
    this.app.renderer.resize(width, height)
    
    if (this.playerSprite) {
      this.playerSprite.x = width * 0.25
      this.playerSprite.y = height * 0.5
    }
    
    if (this.enemySprite) {
      this.enemySprite.x = width * 0.75
      this.enemySprite.y = height * 0.5
    }
  }

  destroy() {
    this.app.destroy(true)
  }
}

export class BeastDisplay {
  private app: PIXI.Application
  private beast: BeastSprite | null = null

  constructor(container: HTMLElement, width: number, height: number) {
    this.app = new PIXI.Application({
      width,
      height,
      backgroundAlpha: 0,
      antialias: true,
      resolution: window.devicePixelRatio || 1
    })
    
    container.appendChild(this.app.view as HTMLCanvasElement)
    this.app.ticker.add(this.update.bind(this))
  }

  setBeast(beastId: string, element: Element, rarity: Rarity, size: number = 120) {
    if (this.beast) {
      this.app.stage.removeChild(this.beast)
    }
    
    this.beast = new BeastSprite(beastId, element, rarity, size)
    this.beast.x = this.app.screen.width / 2
    this.beast.y = this.app.screen.height / 2
    this.app.stage.addChild(this.beast)
  }

  private update(delta: number) {
    if (this.beast) {
      this.beast.update(delta)
    }
  }

  resize(width: number, height: number) {
    this.app.renderer.resize(width, height)
    if (this.beast) {
      this.beast.x = width / 2
      this.beast.y = height / 2
    }
  }

  destroy() {
    this.app.destroy(true)
  }
}
