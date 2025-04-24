import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('reglas')
  .setDescription('Muestra las reglas del juego La Guagua');

export async function execute(interaction) {
  const rulesEmbed = new EmbedBuilder()
    .setColor(0x0099FF)
    .setTitle('🎮 Reglas de La Guagua 🎮')
    .setDescription('Un juego de apuestas con cartas donde debes superar 4 rondas consecutivas para maximizar tus ganancias.')
    .addFields(
      { 
        name: '🎲 Cómo empezar', 
        value: 'Usa `/apostar X` donde X es la cantidad que quieres apostar, luego `/jugar` para unirte a la partida.' 
      },
      { 
        name: '🔴 ⚫ Ronda 1: Rojo o Negro (×2)', 
        value: 'Adivina si la carta será roja o negra. Si aciertas, tu apuesta se multiplica ×2.' 
      },
      { 
        name: '⬆️ ⬇️ Ronda 2: Más Alta o Más Baja (×3)', 
        value: 'Adivina si la siguiente carta será más alta o más baja que la anterior. Si aciertas, tus ganancias se multiplican ×3.' 
      },
      { 
        name: '↔️ Ronda 3: Entre o Fuera (×4)', 
        value: 'Adivina si la siguiente carta estará entre o fuera del rango de tus dos cartas anteriores. Si aciertas, tus ganancias se multiplican ×4.' 
      },
      { 
        name: '♥️ ♦️ ♣️ ♠️ Ronda 4: Adivina el Palo (×10)', 
        value: 'Adivina el palo exacto de la siguiente carta (corazones, diamantes, tréboles o picas). Si aciertas, tus ganancias se multiplican ×10.' 
      },
      { 
        name: '💰 Cobrar tus Ganancias', 
        value: 'En cualquier momento puedes escribir "retirar" para cobrar tus ganancias acumuladas. Si fallas en cualquier ronda, pierdes toda tu apuesta.' 
      },
      { 
        name: '📊 Otros comandos', 
        value: '`/balance` - Ver tu saldo y estadísticas\n`/recargar` - Recarga tu saldo si tienes menos de 100 créditos' 
      }
    )
    .setFooter({ text: 'Recuerda apostar responsablemente. ¡Buena suerte!' });

  await interaction.reply({ embeds: [rulesEmbed] });
}