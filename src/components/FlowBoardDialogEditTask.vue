<script setup lang="ts">
import { v4 as uuid, validate } from 'uuid';
import { computed, inject, ref } from 'vue';
import { Combobox, Dialog, Label } from 'radix-vue/namespaced';
import { VisuallyHidden } from 'radix-vue';
import { Log } from '@/data/resources';
import type {
  LocationIdentifier, LocationResource, LogProperties, LogResource,
  OperationIdentifier, OperationTerm, PartialLog, PlantResource,
} from '@/data/resources';
import { toOptionalIdfier } from '@/utils/idfier';
import { dateRangeKey } from './providerKeys';
import type { DeleteValue } from '@/composables/useBoardData';
import FFDatePicker from '@/components/FFDatePicker.vue';
import IconChevronDown from '@/assets/radix-icons/chevron-down.svg?component';
import IconDotFilled from '@/assets/radix-icons/dot-filled.svg?component';
import IconTrash from '@/assets/radix-icons/trash.svg?component';

const props = defineProps<{
  open: boolean,
  task?: LogResource | PartialLog | Partial<LogProperties>,
  operations?: OperationTerm[],
  locations?: LocationResource[],
  plants?: PlantResource[],
}>();

const emit = defineEmits<{
  (e: 'close'): void,
  (e: 'update:save', value: PartialLog): void,
  (e: 'update:cancel', value: PartialLog | Partial<LogProperties> | undefined): void,
  (e: 'update:delete', value: DeleteValue): void,
}>();

const dateRange = inject(dateRangeKey, ref([new Date(0), new Date(Date.now() * 2)]));

enum IndexOf { Operation, Location }
type ResourceCollection = OperationTerm[]|LocationResource[];
type ResourceIdentifier = OperationIdentifier|LocationIdentifier|null;
function matchResource(collection?: ResourceCollection, idfier?: ResourceIdentifier) {
  const i = collection?.findIndex(resource => resource.id === idfier?.id);
  return typeof i === 'number' ? i : -1;
}
const selected = ref<{ [I in IndexOf]: number }>([
  matchResource(props.operations, props.task?.operation),
  matchResource(props.locations, props.task?.location),
]);
const selectedDateTime = ref<Date|undefined>(props.task?.date);

const selectedOp = computed(() => {
  const i = selected.value[IndexOf.Operation];
  return props?.operations?.[i];
});
const selectedLoc = computed(() => {
  const i = selected.value[IndexOf.Location];
  return props?.locations?.[i];
});

function deleteTask() {
  const taskIdfier = toOptionalIdfier(props.task);
  if (taskIdfier) emit('update:delete', taskIdfier);
  emit('close');
}

function confirmChanges() {
  const logType = selectedOp.value?.log_type || Log.Activity;
  const location = toOptionalIdfier(selectedLoc.value);
  const operation = toOptionalIdfier(selectedOp.value);
  const date = selectedDateTime.value || new Date();
  const plantAtLocation = props.plants?.find(p =>
    p.location.id === selectedLoc.value?.id);
  const plant = toOptionalIdfier(plantAtLocation);
  if (!props.task || !validate(props.task.id || '') || !props.task.type) {
    // If no task was passed as props, or it had no valid ID or log type, it's a
    // new log; assign its type based on the operation's log_type field.
    const opName = selectedOp.value?.name;
    const locName = plantAtLocation?.name || selectedLoc.value?.name;
    const name = [opName, locName].filter(n => !!n).join(', ');
    const task: LogResource = {
      id: uuid(), type: logType,
      name, notes: '',
      date, location, operation, plant,
    };
    emit('update:save', task);
  } else {
    // Otherwise the id and type must be preserved.
    const { id, type } = props.task;
    const log = { id, type, date, location, operation, plant } as PartialLog;
    emit('update:save', log);
  }
  emit('close');
}
function cancelChanges() {
  emit('update:cancel', props.task);
  emit('close');
}

</script>

<template>
  <Dialog.Root
    :open="open">

    <Dialog.Trigger asChild>
      <slot name="trigger" ></slot>
    </Dialog.Trigger>
    <Dialog.Portal>

      <Dialog.Overlay class="edit-dialog-overlay" />
      <Dialog.Content class="edit-dialog-content" >

        <Dialog.Title class="edit-dialog-title" >
          Edit Task
        </Dialog.Title>
        <VisuallyHidden>
          <Dialog.Description class="edit-dialog-description" >
            Make changes to the task.
          </Dialog.Description>
        </VisuallyHidden>

        <Label class="label-combobox" for="edit-task-op">Task</Label>
        <Combobox.Root :model-value="selectedOp?.name || ''" >
          <Combobox.Anchor class="combobox-anchor">
            <Combobox.Input id="edit-task-op" class="combobox-input" />
            <Combobox.Trigger >
              <IconChevronDown/>
            </Combobox.Trigger>
          </Combobox.Anchor>
          <Combobox.Content class="combobox-content">
            <Combobox.Viewport class="combobox-viewport" >
              <Combobox.Empty class="combobox-empty"/>
              <Combobox.Item v-for="(op, k) in operations"
                class="combobox-item"
                @select="selected[IndexOf.Operation] = k"
                :value="op.name"
                :key="`edit-task-op-combobox-item-${k}`">
                <Combobox.ItemIndicator class="combobox-item-indicator" >
                  <IconDotFilled/>
                </Combobox.ItemIndicator>
                {{ op.name }}
              </Combobox.Item>
            </Combobox.Viewport>
          </Combobox.Content>
        </Combobox.Root>

        <Label class="label-combobox" for="edit-task-location">Location</Label>
        <Combobox.Root :model-value="selectedLoc?.name || ''">
          <Combobox.Anchor class="combobox-anchor">
            <Combobox.Input id="edit-task-location" class="combobox-input" />
            <Combobox.Trigger >
              <IconChevronDown/>
            </Combobox.Trigger>
          </Combobox.Anchor>
          <Combobox.Content class="combobox-content">
            <Combobox.Viewport class="combobox-viewport" >
              <Combobox.Empty class="combobox-empty"/>
              <Combobox.Item v-for="(location, l) in locations"
                class="combobox-item"
                @select="selected[IndexOf.Location] = l"
                :value="location.name"
                :key="`edit-task-location-combobox-item-${l}`">
                <Combobox.ItemIndicator class="combobox-item-indicator" >
                  <IconDotFilled/>
                </Combobox.ItemIndicator>
                {{ location.name }}
              </Combobox.Item>
            </Combobox.Viewport>
          </Combobox.Content>
        </Combobox.Root>

        <FFDatePicker
          @change="selectedDateTime = $event"
          :value="selectedDateTime"
          :min-value="dateRange[0]"
          :max-value="dateRange[1]" />

        <div class="edit-dialog-btns">
          <button
            v-if="task"
            type="button"
            @click="deleteTask"
            aria-label="Delete"
            class="edit-dialog-btn btn-delete" >
            <IconTrash />
          </button>
          <Dialog.Close as-child >
            <button
              type="button"
              @click="cancelChanges"
              aria-label="Close"
              class="edit-dialog-btn btn-cancel">
              Cancel
            </button>
          </Dialog.Close>
          <Dialog.Close as-child >
            <button
              type="button"
              @click="confirmChanges"
              aria-label="Save"
              class="edit-dialog-btn btn-save">
              Save
            </button>
          </Dialog.Close>
        </div>

      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>
</template>

<style scoped>
/* reset */
button, input {
  all: unset;
}

.edit-dialog-close {
  font-family: inherit;
  border-radius: 100%;
  height: 15px;
  width: 15px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--ff-c-green);
  position: absolute;
  top: .5rem;
  right: .5rem;
}
.edit-dialog-close:hover {
  background-color: var(--ff-c-green-transparent-2);
}
.edit-dialog-close:focus {
  box-shadow: 0 0 0 2px var(--ff-c-green-transparent-2);
}

.edit-dialog-title {
  color: var(--color-heading);
}
.edit-dialog-overlay {
  background-color: var(--ff-c-black-transparent-1);
  position: fixed;
  inset: 0;
  animation: overlayShow 150ms cubic-bezier(0.16, 1, 0.3, 1);
}

.edit-dialog-content {
  background-color: var(--color-background-soft);
  border-radius: 6px;
  box-shadow: hsl(206 22% 7% / 35%) 0px 10px 38px -10px, hsl(206 22% 7% / 20%) 0px 10px 20px -15px;
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  max-height: 85vh;
  padding: 25px;
  animation: contentShow 150ms cubic-bezier(0.16, 1, 0.3, 1);
}

.edit-dialog-btns {
  display: flex;
  justify-content: flex-end;
  margin-top: 1.5rem;
}
.edit-dialog-btns button.edit-dialog-btn {
  font-size: 16px;
  font-weight: 500;
  line-height: 1.5;
  text-wrap: nowrap;
  background-color: var(--color-background-soft);
  border: 1px solid var(--color-border);
  color: var(--color-text);
  padding: .375rem .75rem;
  margin-right: .375rem;
  margin-bottom: .375rem;
  border-radius: 4px;
  cursor: pointer;
}

.edit-dialog-btns button.edit-dialog-btn:focus-visible {
  border: 1px solid var(--color-text);
}

.edit-dialog-btns button.edit-dialog-btn.btn-save,
.edit-dialog-btns button.edit-dialog-btn.btn-cancel:hover,
.edit-dialog-btns button.edit-dialog-btn.btn-cancel:focus {
  color: var(--ff-c-green);
  background-color: var(--color-background);
}

.edit-dialog-btns button.edit-dialog-btn.btn-save:hover,
.edit-dialog-btns button.edit-dialog-btn.btn-save:focus {
  background-color: var(--ff-c-green-transparent-3);
}

.edit-dialog-btns button.edit-dialog-btn.btn-delete {
  border: none;
  color: var(--vt-c-red);
}

.edit-dialog-btns button.edit-dialog-btn.btn-delete:hover,
.edit-dialog-btns button.edit-dialog-btn.btn-delete:focus {
  box-shadow: 0 0 2px 1px var(--vt-c-red);
  background-color: var(--color-background);
}

.combobox-root {
  position: relative;
}

.combobox-anchor {
  display: inline-flex;
  align-items: center;
  justify-content: between; 
  font-size: 13px;
  line-height: 1;
  height: 35px;
  padding: 0 15px;
  gap: 5px;
  background-color: var(--color-background);
  color: var(--ff-c-green);
  border-radius: 4px;
  box-shadow: 0 2px 10px var(--color-box-shadow-3);
}
.combobox-anchor:hover {
  background-color: var(--ff-c-green-transparent-3);
}

.combobox-input {
  height: 100%;
  background-color: transparent;
  color: var(--ff-c-green);
}
.combobox-input[data-placeholder] {
  color: var(--ff-c-green-transparent-2);
}

.combobox-icon {
  width: 16px;
  height: 16px;
  color: var(--ff-c-green);
}

.combobox-content {
  z-index: 10;
  width: 100%;
  position: absolute;
  overflow: hidden;
  background-color: var(--color-background);
  border-radius: 6px;
  margin-top: 8px;
  box-shadow: 0px 10px 38px -10px rgba(22, 23, 24, 0.35), 0px 10px 20px -15px rgba(22, 23, 24, 0.2);
}

.combobox-viewport {
  padding: 5px;
}

.combobox-empty {
  padding-top: 0.5rem;
  padding-bottom: 0.5rem;
  text-align: center;
  font-size: 0.75rem;
  line-height: 1rem;
  font-weight: 500; 
  color: var(--color-text)
}

.combobox-item {
  font-size: 13px;
  line-height: 1;
  color: var(--ff-c-green);
  border-radius: 3px;
  display: flex;
  align-items: center;
  height: 25px;
  padding: 0 35px 0 25px;
  position: relative;
  user-select: none;
}
.combobox-item[data-disabled] {
  color: var(--color-border);
  pointer-events: none;
}
.combobox-item[data-highlighted] {
  outline: none;
  background-color: var(--ff-c-green-transparent-2);
  color: var(--color-heading);
}

.combobox-label {
  padding: 0 25px;
  font-size: 12px;
  line-height: 25px;
  color: var(--color-text);
}

.combobox-separator {
  height: 1px;
  background-color: var(--ff-c-green-transparent-3);
  margin: 5px;
}

.combobox-item-indicator {
  position: absolute;
  left: 0;
  width: 25px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

@keyframes overlayShow {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes contentShow {
  from {
    opacity: 0;
    transform: translate(-50%, -48%) scale(0.96);
  }
  to {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
}
</style>