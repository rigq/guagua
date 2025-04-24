# La Guagua - Bot de Discord para Juegos de Apuestas

Un bot de Discord que implementa el juego de cartas "La Guagua" con sistema de apuestas y moneda virtual.

## Características

- Sistema de apuestas con moneda virtual
- Juego completo de poker con 4 rondas progresivas
- Multiplicadores de apuesta por cada ronda superada
- Sistema de persistencia de datos con MongoDB
- Múltiples jugadores pueden unirse a una partida
- Opción de cobrar ganancias en cualquier momento
- Ranking de jugadores y sistema de estadísticas

## Comandos

- `/apostar X` - Realiza una apuesta de X créditos
- `/jugar` - Únete a la partida actual
- `/balance` - Muestra tu saldo y estadísticas
- `/recargar` - Recarga tu saldo si tienes menos de 100 créditos
- `/reglas` - Muestra las reglas del juego
- `/ranking` - Muestra el ranking de los mejores jugadores

## Reglas del Juego

1. **Ronda 1: Rojo o Negro (×2)**
   - Adivina si la carta será roja o negra
   - Si aciertas, tu apuesta se multiplica ×2

2. **Ronda 2: Más Alta o Más Baja (×3)**
   - Adivina si la siguiente carta será más alta o más baja que la anterior
   - Si aciertas, tus ganancias se multiplican ×3

3. **Ronda 3: Entre o Fuera (×4)**
   - Adivina si la siguiente carta estará entre o fuera del rango de tus dos cartas anteriores
   - Si aciertas, tus ganancias se multiplican ×4

4. **Ronda 4: Adivina el Palo (×10)**
   - Adivina el palo exacto de la siguiente carta (corazones, diamantes, tréboles o picas)
   - Si aciertas, tus ganancias se multiplican ×10

En cualquier momento puedes escribir "retirar" para cobrar tus ganancias acumuladas. Si fallas en cualquier ronda, pierdes toda tu apuesta.

## Configuración

1. Crea un archivo `.env` basado en `.env.example`
2. Configura tu token de Discord, ID de aplicación, ID de servidor y URI de MongoDB
3. Ejecuta `npm i` para instalar las dependencias
4. Ejecuta `node src/deploy-commands.js` para registrar los comandos
5. Ejecuta `npm start` para iniciar el bot

## Requisitos

- Node.js 16.9.0 o superior
- MongoDB
- Token de bot de Discord