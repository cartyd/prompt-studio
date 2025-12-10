/**
 * Canvas Node System - Interactive particle network animation
 * Extracted from home.ejs for better maintainability and testability
 */

(function() {
  'use strict';

  // Respect reduced motion preference
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return;
  }
  
  // Configuration object
  const CONFIG = {
    NODE: {
      MIN_RADIUS: 2,
      MAX_RADIUS: 4,
      COUNT_DESKTOP: 40,
      COUNT_MOBILE: 20,
      MAX_CONNECTION_DISTANCE: 120
    },
    COLORS: {
      PRIMARY: 'rgba(52, 152, 219, 0.5)',
      ACCENT: 'rgba(216, 92, 40, 0.5)',
      NEUTRAL: 'rgba(200, 200, 200, 0.5)'
    },
    GLOW: {
      RADIUS: 100,
      TIMEOUT_MS: 150,
      COLOR_START: 'rgba(255, 223, 0, 0.25)',
      COLOR_END: 'rgba(255, 223, 0, 0)'
    },
    MOBILE_BREAKPOINT: 768
  };
  
  class Node {
    constructor(canvas, colors) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.x = Math.random() * canvas.width;
      this.y = Math.random() * canvas.height;
      this.vx = (Math.random() - 0.5);
      this.vy = (Math.random() - 0.5);
      this.radius = CONFIG.NODE.MIN_RADIUS + Math.random() * (CONFIG.NODE.MAX_RADIUS - CONFIG.NODE.MIN_RADIUS);
      this.colors = colors;
      this.color = this.colors[Math.floor(Math.random() * this.colors.length)];
    }
    
    draw() {
      this.ctx.beginPath();
      this.ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = this.color;
      this.ctx.fill();
    }
    
    update() {
      this.x += this.vx;
      this.y += this.vy;
      if (this.x < 0 || this.x > this.canvas.width) this.vx = -this.vx;
      if (this.y < 0 || this.y > this.canvas.height) this.vy = -this.vy;
    }
  }
  
  class NodeSystem {
    constructor(canvasId) {
      this.canvas = document.getElementById(canvasId);
      if (!this.canvas) {
        console.warn('Canvas element with id "' + canvasId + '" not found');
        return;
      }
      
      // Try to get 2d context with error handling
      try {
        this.ctx = this.canvas.getContext('2d');
        if (!this.ctx) {
          console.error('Failed to get 2d context from canvas');
          return;
        }
      } catch (error) {
        console.error('Error getting canvas context:', error);
        return;
      }
      
      this.nodes = [];
      this.colors = [CONFIG.COLORS.PRIMARY, CONFIG.COLORS.ACCENT, CONFIG.COLORS.NEUTRAL];
      this.maxDistance = CONFIG.NODE.MAX_CONNECTION_DISTANCE;
      this.mouseX = 0;
      this.mouseY = 0;
      this.mouseActive = false;
      this.mouseTimer = null;
      this.animationId = null;
      this.isInitialized = true;
      
      // Optimize for mobile
      this.isMobile = window.innerWidth < CONFIG.MOBILE_BREAKPOINT;
      this.nodeCount = this.isMobile ? CONFIG.NODE.COUNT_MOBILE : CONFIG.NODE.COUNT_DESKTOP;
      
      // Bind methods to preserve context
      this.handleResize = () => this.resizeCanvas();
      this.handleMouseMove = (e) => this.onMouseMove(e);
      
      this.init();
      window.addEventListener('resize', this.handleResize);
      window.addEventListener('mousemove', this.handleMouseMove);
    }
    
    init() {
      this.resizeCanvas();
      for (let i = 0; i < this.nodeCount; i++) {
        this.nodes.push(new Node(this.canvas, this.colors));
      }
      this.animate();
    }
    
    resizeCanvas() {
      this.canvas.width = this.canvas.offsetWidth;
      this.canvas.height = this.canvas.offsetHeight;
    }
    
    onMouseMove(e) {
      const rect = this.canvas.getBoundingClientRect();
      this.mouseX = e.clientX - rect.left;
      this.mouseY = e.clientY - rect.top;
      this.mouseActive = true;
      clearTimeout(this.mouseTimer);
      this.mouseTimer = setTimeout(() => this.mouseActive = false, CONFIG.GLOW.TIMEOUT_MS);
    }
    
    drawGlow() {
      if (!this.mouseActive) return;
      const gradient = this.ctx.createRadialGradient(
        this.mouseX, this.mouseY, 0,
        this.mouseX, this.mouseY, CONFIG.GLOW.RADIUS
      );
      gradient.addColorStop(0, CONFIG.GLOW.COLOR_START);
      gradient.addColorStop(1, CONFIG.GLOW.COLOR_END);
      this.ctx.beginPath();
      this.ctx.fillStyle = gradient;
      this.ctx.arc(this.mouseX, this.mouseY, CONFIG.GLOW.RADIUS, 0, Math.PI * 2);
      this.ctx.fill();
    }
    
    drawConnections() {
      // Optimize by checking squared distance first (avoids sqrt)
      const maxDistSquared = this.maxDistance * this.maxDistance;
      
      for (let i = 0; i < this.nodes.length; i++) {
        const a = this.nodes[i];
        
        for (let j = i + 1; j < this.nodes.length; j++) {
          const b = this.nodes[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const distSquared = dx * dx + dy * dy;
          
          // Early exit if too far (without expensive sqrt)
          if (distSquared >= maxDistSquared) continue;
          
          // Only calculate actual distance when we know we'll draw
          const dist = Math.sqrt(distSquared);
          const opacity = 1 - dist / this.maxDistance;
          
          this.ctx.beginPath();
          this.ctx.strokeStyle = CONFIG.COLORS.NEUTRAL.replace('0.5', opacity.toFixed(2));
          this.ctx.lineWidth = 1;
          this.ctx.moveTo(a.x, a.y);
          this.ctx.lineTo(b.x, b.y);
          this.ctx.stroke();
        }
      }
    }
    
    animate() {
      this.animationId = requestAnimationFrame(() => this.animate());
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.nodes.forEach(n => {
        n.update();
        n.draw();
      });
      this.drawConnections();
      this.drawGlow();
    }
    
    destroy() {
      // Only clean up if properly initialized
      if (!this.isInitialized) return;
      
      // Clean up event listeners
      if (this.handleResize) {
        window.removeEventListener('resize', this.handleResize);
      }
      if (this.handleMouseMove) {
        window.removeEventListener('mousemove', this.handleMouseMove);
      }
      
      // Cancel animation frame
      if (this.animationId) {
        cancelAnimationFrame(this.animationId);
      }
      
      // Clear timer
      if (this.mouseTimer) {
        clearTimeout(this.mouseTimer);
      }
      
      this.isInitialized = false;
    }
  }
  
  // Initialize the node system when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      const nodeSystem = new NodeSystem('heroCanvas');
      
      // Clean up on page unload (optional but good practice)
      window.addEventListener('beforeunload', () => {
        if (nodeSystem && typeof nodeSystem.destroy === 'function') {
          nodeSystem.destroy();
        }
      });
    });
  } else {
    const nodeSystem = new NodeSystem('heroCanvas');
    
    // Clean up on page unload (optional but good practice)
    window.addEventListener('beforeunload', () => {
      if (nodeSystem && typeof nodeSystem.destroy === 'function') {
        nodeSystem.destroy();
      }
    });
  }
})();
