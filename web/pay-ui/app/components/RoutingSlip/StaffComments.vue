<script setup lang="ts">
import type { Comment } from '@/interfaces/routing-slip'
import { DateTime } from 'luxon'

interface Props {
  identifier?: string
  nudgeTop?: number
  nudgeLeft?: number
  maxLength?: number
}

const payApi = usePayApi()
const { $sanitize } = useNuxtApp()

const props = withDefaults(defineProps<Props>(), {
  identifier: '',
  nudgeTop: 33,
  nudgeLeft: 20,
  maxLength: 2000
})

const textareaRef = useTemplateRef<HTMLTextAreaElement>('textareaRef')

const state = reactive({
  showComments: false,
  comments: [] as Comment[] | Array<{ comment: Comment }>,
  comment: '',
  isSaving: false,
  errorMessage: '',
  isIntentionalClose: false,
  numComments: computed((): string => {
    const num: number = state.comments.length
    return num === 1 ? '1 Comment' : `${num} Comments`
  }),
  headerColor: computed((): string => {
    return 'text-blue-600'
  }),
  charsRemaining: computed((): number => {
    const length: number = state.comment ? state.comment.length : 0
  return props.maxLength - length
})
})

const { showComments, comments, comment, isSaving, errorMessage, numComments, headerColor,
  charsRemaining } = toRefs(state)

function formatTimestamp(timestamp: string): string {
  if (!timestamp) {
    return ''
  }

  const dt = DateTime.fromISO(timestamp, { zone: 'UTC' }).setZone('America/Vancouver')
  return dt.isValid ? `${dt.toFormat('MMM dd, yyyy h:mm a')} Pacific time` : timestamp
}

function validateComment(): void {
  state.errorMessage = ''

  if (!state.comment || state.comment.trim().length === 0) {
    state.errorMessage = 'Enter a comment.'
    return
  }

  if (state.comment.length > props.maxLength) {
    state.errorMessage = 'Maximum characters reached.'
    return
  }
}

async function fetchStaffComments(): Promise<void> {
  try {
    const response = await payApi.getRoutingSlipComments(props.identifier)
    const fetchedComments = (response?.comments) || []

    if (Array.isArray(fetchedComments) && fetchedComments[0] && typeof fetchedComments[0].comment === 'string') {
      state.comments = fetchedComments
    } else {
      state.comments = flattenAndSortComments(fetchedComments as Array<{ comment: Comment }>)
    }
  } catch (error) {
    console.error('Error fetching comments:', error)
    state.comments = []
  }
}

defineExpose({
  fetchStaffComments
})

onMounted(async () => {
  await fetchStaffComments()
})

async function save(): Promise<void> {
  validateComment()
  if (state.errorMessage) {
    return
  }

  if (state.isSaving) {
    return
  }

  state.isSaving = true

  const data = {
    comment: {
      businessId: props.identifier,
      comment: state.comment
    }
  }

  try {
    await payApi.updateRoutingSlipComments(data, props.identifier)
    state.comment = ''
    state.errorMessage = ''
    await fetchStaffComments()
  } catch (error) {
    console.error('save() error =', error)
    if (typeof window !== 'undefined') {
      alert('Could not save your comment. Please try again or cancel.')
    }
  } finally {
    state.isSaving = false
  }
}

function close(): void {
  state.isIntentionalClose = true
  state.errorMessage = ''
  state.showComments = false
  nextTick(() => {
    state.isIntentionalClose = false
  })
}

function handleOpenUpdate(newValue: boolean): void {
  if (!newValue && !state.isIntentionalClose) {
    state.showComments = true
  }
}

function flattenAndSortComments(commentsArray: Array<{ comment: Comment }>): Array<Comment> {
  if (commentsArray && commentsArray.length > 0) {
    // first use map to change comment.comment to comment
    const temp: Array<Comment> = commentsArray.map(c => c.comment)
    // then sort newest to oldest
    temp.sort((a, b) => new Date(a.timestamp) < new Date(b.timestamp) ? 1 : -1)
    return temp
  }
  return []
}

</script>

<template>
  <div
    id="staff-comments"
    class="inline-block"
  >
    <UPopover
      v-model:open="showComments"
      :popper="{
        placement: 'bottom-start',
        offset: [nudgeLeft, nudgeTop],
        strategy: 'fixed'
      }"
      @update:open="handleOpenUpdate"
    >
      <UButton
        id="comments-button"
        color="primary"
        variant="ghost"
        size="sm"
        icon="i-mdi-comment-text-outline"
      >
        {{ numComments }}
      </UButton>

      <template #content>
        <div
          id="staff-comment-container"
          class="bg-white rounded-lg shadow-lg p-6 w-[33rem] max-h-[36rem] flex flex-col"
        >
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center gap-2">
              <UIcon
                name="i-mdi-comment-text-outline"
                :class="['w-5 h-5', headerColor]"
              />
              <span :class="['text-sm font-medium', headerColor]">{{ numComments }}</span>
            </div>
            <button
              id="close-button"
              class="text-blue-600 hover:text-blue-700 transition-colors"
              @click="close()"
            >
              <UIcon
                name="i-mdi-close"
                class="w-5 h-5"
              />
            </button>
          </div>

          <div class="mb-4">
            <div class="relative">
              <textarea
                ref="textareaRef"
                v-model="comment"
                autofocus
                rows="5"
                placeholder="Enter Comments"
                :class="[
                  'w-full px-3 py-2 bg-gray-100 border-0 border-b-2 rounded-t resize-none',
                  'placeholder:text-gray-400 focus:outline-none focus:ring-0',
                  errorMessage
                    ? 'border-red-500'
                    : 'border-blue-500'
                ]"
                @blur="validateComment"
              />
              <div
                v-if="errorMessage"
                class="mt-1 text-sm text-red-600"
              >
                {{ errorMessage }}
              </div>
            </div>
          </div>

          <div class="flex items-center justify-between mb-6">
            <div class="text-sm text-gray-400">
              {{ charsRemaining }} characters remaining
            </div>
            <div class="flex gap-2 items-center">
              <UButton
                id="save-button"
                color="primary"
                variant="ghost"
                :loading="isSaving"
                class="font-bold"
                @click="save()"
              >
                Save
              </UButton>
              <UButton
                id="cancel-button"
                color="primary"
                variant="ghost"
                @click="close()"
              >
                Cancel
              </UButton>
            </div>
          </div>

          <div
            id="existing-comments"
            class="flex-1 overflow-y-auto pr-2"
          >
            <!-- eslint-disable vue/no-v-html -->
            <div
              v-for="(commentItem, i) in comments"
              :key="i"
              class="text-sm mb-4"
              :class="{ 'pt-4 border-t border-gray-300': i > 0 }"
            >
              <p
                class="whitespace-pre-line text-gray-700"
                v-html="$sanitize(commentItem.comment)"
              />
              <p class="text-gray-500 text-xs mt-1">
                {{ commentItem.submitterDisplayName }}
                &hyphen;
                {{ formatTimestamp(commentItem.timestamp) }}
              </p>
            </div>
            <!-- eslint-enable vue/no-v-html -->
          </div>
        </div>
      </template>
    </UPopover>
  </div>
</template>

<style lang="scss" scoped>
#staff-comment-container {
  width: 33rem;
  max-height: 36rem;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

#existing-comments {
  max-height: 16rem;
  overflow-y: auto;
  text-align: left;

  /* Custom scrollbar styling */
  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: #f1f1f1;
  }

  &::-webkit-scrollbar-thumb {
    background: #888;
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: #555;
  }
}
</style>
