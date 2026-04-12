import { useState } from 'react'
import { Plus, Check, X, Package } from 'lucide-react'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

export default function EquipmentChecklist({ sessionId, items, setItems, isCreator, currentUserId, isParticipant }) {
  const [newItem, setNewItem] = useState('')
  const [adding, setAdding] = useState(false)

  const handleAdd = async (e) => {
    e.preventDefault()
    if (!newItem.trim()) return
    setAdding(true)
    try {
      const { data, error } = await supabase
        .from('equipment_items')
        .insert({ session_id: sessionId, item_name: newItem.trim() })
        .select()
        .single()
      if (error) throw error
      setItems(prev => [...prev, data])
      setNewItem('')
    } catch (err) {
      toast.error('Fehler beim Hinzufügen.')
    } finally {
      setAdding(false)
    }
  }

  const handleDelete = async (itemId) => {
    try {
      const { error } = await supabase.from('equipment_items').delete().eq('id', itemId)
      if (error) throw error
      setItems(prev => prev.filter(i => i.id !== itemId))
    } catch {
      toast.error('Fehler beim Löschen.')
    }
  }

  const handleClaim = async (item) => {
    if (!isParticipant && !isCreator) {
      toast.error('Nur Teilnehmer können Ausrüstung beanspruchen.')
      return
    }
    try {
      if (item.brought_by === currentUserId) {
        // Unclaim
        const { error } = await supabase.rpc('unclaim_equipment', { p_item_id: item.id })
        if (error) throw error
        setItems(prev => prev.map(i => i.id === item.id ? { ...i, brought_by: null, bringer: null } : i))
        toast.success('Freigegeben.')
      } else if (!item.brought_by) {
        // Claim
        const { error } = await supabase.rpc('claim_equipment', { p_item_id: item.id, p_user_id: currentUserId })
        if (error) throw error
        setItems(prev => prev.map(i => i.id === item.id ? { ...i, brought_by: currentUserId } : i))
        toast.success('Du bringst das mit! 👍')
      }
    } catch (err) {
      toast.error(err.message || 'Fehler.')
    }
  }

  return (
    <div className="bg-card rounded-2xl border border-white/10 p-5">
      <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wide flex items-center gap-2">
        <Package className="w-4 h-4 text-primary" />
        Ausrüstung
      </h3>

      {items.length === 0 && !isCreator && (
        <p className="text-muted text-sm text-center py-3">Keine Ausrüstung definiert.</p>
      )}

      <div className="flex flex-col gap-2 mb-3">
        {items.map(item => {
          const claimed = !!item.brought_by
          const mine = item.brought_by === currentUserId

          return (
            <div
              key={item.id}
              className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                claimed
                  ? mine
                    ? 'bg-primary/10 border-primary/30'
                    : 'bg-white/5 border-white/5 opacity-60'
                  : 'bg-dark border-white/5 hover:border-white/20'
              }`}
            >
              <button
                onClick={() => handleClaim(item)}
                disabled={claimed && !mine}
                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                  mine
                    ? 'bg-primary border-primary text-dark'
                    : claimed
                    ? 'border-white/20 bg-white/10'
                    : 'border-white/30 hover:border-primary'
                } disabled:cursor-not-allowed`}
              >
                {claimed && <Check className="w-3 h-3" />}
              </button>

              <span className={`flex-1 text-sm ${claimed && !mine ? 'text-muted line-through' : 'text-white'}`}>
                {item.item_name}
              </span>

              {mine && (
                <span className="text-primary text-xs font-medium shrink-0">Du bringst es</span>
              )}
              {claimed && !mine && item.bringer && (
                <span className="text-muted text-xs shrink-0">{item.bringer.name}</span>
              )}

              {isCreator && (
                <button
                  onClick={() => handleDelete(item.id)}
                  className="p-1 text-muted hover:text-red-400 transition-colors shrink-0"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )
        })}
      </div>

      {isCreator && (
        <form onSubmit={handleAdd} className="flex gap-2">
          <input
            type="text"
            placeholder="z.B. Ball, Leibchen..."
            value={newItem}
            onChange={e => setNewItem(e.target.value)}
            maxLength={50}
            className="flex-1 bg-dark border border-white/10 rounded-xl px-3 py-2 text-white text-sm placeholder-muted focus:outline-none focus:border-primary transition-colors"
          />
          <button
            type="submit"
            disabled={adding || !newItem.trim()}
            className="p-2 bg-primary text-dark rounded-xl hover:bg-green-400 transition-colors disabled:opacity-50 shrink-0"
          >
            <Plus className="w-4 h-4" />
          </button>
        </form>
      )}
    </div>
  )
}
